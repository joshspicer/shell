from concurrent.futures import ThreadPoolExecutor
import logging
import os
import json
import tempfile
import traceback
import paramiko

import tornado.web
from tornado.process import cpu_count
from tornado.options import options

from shell import controllers
from shell.models.base import Base
from shell.controllers.v2 import BaseMixin
from shell.errors import InvalidValueError
from shell.models import (
    LogEntry,
)
from shell.models.prompt import Prompt
from shell.models.worker import save_worker_for_session, recycle_worker, clients


class ApiPromptSessionsController(BaseMixin, tornado.web.RequestHandler):
    executor = ThreadPoolExecutor(max_workers=cpu_count() * 5)

    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop, policy, host_keys_settings):
        super(ApiPromptSessionsController, self).initialize(loop)
        logging.info(self.request)
        self.policy = policy
        self.host_keys_settings = host_keys_settings
        self.ssh_client = self._get_ssh_client()
        self.debug = self.settings.get("debug", False)
        self.result = dict(id=None, status=None, encoding=None, session_id=None)

    def write_error(self, status_code, **kwargs):
        if controllers.swallow_http_errors and self.request.method == "POST":
            exc_info = kwargs.get("exc_info")
            if exc_info:
                reason = getattr(exc_info[1], "log_message", None)
                if reason:
                    self._reason = reason
            self.result.update(status=self._reason)
            self.set_status(status_code)
            self.finish(self.result)
        else:
            super(ApiPromptSessionsController, self).write_error(status_code, **kwargs)

    def _log_session(self, session_id, human_location, ip, target_host, reason, prompt):
        record_output = self.current_casedshell().record_output
        session = LogEntry.create(
            creator=self.get_current_user(),
            ip_address=ip,
            reason=reason,
            prompt=str(prompt),
            metadata_={
                "session_id": session_id,
                "human_location": human_location,
                "target_host": target_host,
                "record_output": record_output,
            },
        )

        return session.id

    def _check_origin(self):
        event_origin = self.get_argument("_origin", "")
        header_origin = self.request.headers.get("Origin")
        origin = event_origin or header_origin
        if origin:
            if not super(ApiPromptSessionsController, self).check_origin(origin):
                raise tornado.web.HTTPError(
                    403, "Cross origin operation is not allowed."
                )

            if not event_origin and self.origin_policy != "same":
                self.set_header("Access-Control-Allow-Origin", origin)

    @tornado.web.authenticated
    @tornado.gen.coroutine
    def post(self):
        slug = self.get_argument("slug", None)
        reason = self.get_argument("reason", None)

        if slug is None:
            raise tornado.web.HTTPError(400, "The 'slug' parameter is required.")

        prompt = Prompt.get(slug)
        if prompt is None:
            self.set_status(400)
            raise tornado.web.HTTPError(400, "No prompt found for '{}'.".format(slug))

        username = self.get_argument("username", prompt.username)

        self._check_origin()

        ip, port = self.get_client_addr()

        human_location = self.get_human_location(ip)

        approval_request = None

        workers = clients.get(self.session_id, {})
        if workers and len(workers) >= options.maxconn:
            raise tornado.web.HTTPError(403, "Too many live connections.")

        with tempfile.TemporaryDirectory() as temp_dir:
            need_approval = prompt.approval_required_from_approval_settings()
            approval_status = self.get_argument("approval_status", None)
            if need_approval and approval_status != "approved":
                self.set_status(401)
                self.write(self.result)
            else:
                pass

            try:
                hostname = prompt.hostname
                port = prompt.port
                password = None
                pkey = self.get_pkey(self.token, temp_dir)

                args = (hostname, port, username, password, pkey, self.session_id)
                logging.debug(args)
            except InvalidValueError as exc:
                raise tornado.web.HTTPError(400, str(exc))

            future = self.executor.submit(
                self._ssh_connect_to_worker,
                args,
                prompt.initial_command(),
                prompt.close_terminal_on_exit,
            )

            try:
                worker = yield future
            except (ValueError, paramiko.SSHException) as exc:
                # Catch exceptions from the worker ssh connection
                logging.error(traceback.format_exc())
                self.result.update(status=str(exc))
                self.write(self.result)
                return
            except AttributeError as exc:
                # Catch exceptions for bad host key (which will generate this error)
                # https://github.com/cased/shell/pull/99#issuecomment-1083274523
                logging.error(traceback.format_exc())
                self.result.update(status="Bad host key.")
                self.write(self.result)
                return
            else:
                worker.src_addr = (ip, port)
                save_worker_for_session(self.session_id, worker)
                self.loop.call_later(options.delay, recycle_worker, worker)

                # Log the new session
                record_output = self.current_casedshell().record_output
                if record_output is True:
                    worker.enable_recording()

                target_host = prompt.hostname
                log_entry_id = self._log_session(
                    self.session_id,
                    human_location,
                    ip,
                    target_host,
                    reason,
                    prompt.labels,
                )

                if approval_request:
                    approval_request.update(log_entry_id=log_entry_id)

                if worker.authentication_completed:
                    self.result.update(
                        id=worker.id,
                        encoding=worker.encoding,
                        session_id=str(self.session_id),
                        session_uuid=self.session_id,
                        hostname=prompt.hostname,
                        port=prompt.port,
                        username=username,
                        proxy_jump=prompt.proxy_jump_string(),
                        pre_download_command=prompt.pre_download_command,
                    )
                else:
                    logging.info("More authentication information needed.")
                    if worker.ssh_client.keyboard_interactive_handler is not None:
                        self.set_status(202)
                        self.result.update(
                            id=worker.id,
                            title=worker.ssh_client.keyboard_interactive_handler.title,
                            instructions=worker.ssh_client.keyboard_interactive_handler.instructions,
                            prompt_list=worker.ssh_client.keyboard_interactive_handler.prompt_list,
                            session_id=str(self.session_id),
                            session_uuid=self.session_id,
                            status="Authentication required.",
                        )

            self.write(self.result)
