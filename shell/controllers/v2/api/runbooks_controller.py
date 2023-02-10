import tempfile
import logging
import json
import subprocess
import re
import requests
import tornado.web
import sqlalchemy
from shell.models.base import Base

from shell.controllers.v2 import BaseMixin

from shell.models import (
    Prompt,
    Runbook,
    APIProvider,
    Organization,
    LogEntry,
    Database,
)

from shell.utils import json_decode


def api_routes(**kwargs):
    return [
        (r"/api/runbooks/(\d+)", RunbooksAPIShow, kwargs),
        (r"/api/runbooks", RunbooksAPIHandler, kwargs),
        (r"/api/runbooks/(\d+)/run", RunbooksAPIRun, kwargs),
    ]


class RESTProcessor:
    def __init__(self, block):
        self.block = block

    def prepare_body_and_headers(self):
        data = self.block.data

        body = {}
        for qp in data["query_parameters"]:
            body[qp["key"]] = qp["value"]

        headers = {}
        for h in data["headers"]:
            headers[h["key"]] = h["value"]

        return [body, headers]

    def run(self):
        data = self.block.data

        provider = APIProvider.find_by(id=data["api_provider_id"])[
            0
        ]  # TODO: add unique index on api name

        body, headers = self.prepare_body_and_headers()
        url = provider.base_url + data["api_path"]

        if provider.authentication_type == "basic":
            return requests.request(
                data["http_method"],
                url,
                json=body,
                headers=headers,
                auth=(provider.data["username"], provider.get_provider_pw()),
            )
        elif provider.authentication_type == "auth":
            headers["Authorization"] = "Bearer {}".format(provider.get_provider_pw())
            return requests.request(
                data["http_method"],
                url,
                json=body,
                headers=headers,
            )
        else:
            # no auth
            return requests.request(
                data["http_method"],
                url,
                json=body,
                headers=headers,
            )


class TextProcessor:
    @staticmethod
    def process(string, context):
        # substitutes block slugs in the string using the passed-in context
        # process("{hello.world}", {hello: {world: "test"}}) => "test"
        def navigate_dict(d, *keys):
            def navigate_dict_ex(d, keys, fallback=None):
                for key in keys:
                    if key in d:
                        d = d[key]
                    else:
                        return fallback
                return d

            return navigate_dict_ex(d, keys)

        def replace(match):
            removed_brackets = match.group(0)[1:-1]
            array_string = removed_brackets.split(".")
            value = navigate_dict(context, *array_string)
            if value is None:
                return match.group(0)
            else:
                return value

        processed_command = re.sub(r"{[^{}]+(?=})}", replace, string)
        return processed_command


class RunbooksAPIShow(BaseMixin, tornado.web.RequestHandler):
    def initialize(self, loop, **kwargs):
        super(RunbooksAPIShow, self).initialize(loop)

    @tornado.web.authenticated
    def get(self, id):
        try:
            _runbook = Runbook.find_or_fail(id)
        except Exception as e:
            self.set_status(404)
            self.write({"status": 404, "reason": str(e)})
            return

        _blocks = _runbook.get_blocks()
        _prompts = self._get_prompts()
        _api_providers = APIProvider.all()
        _databases = Database.all()

        def process_prompt(prompt):
            return {"name": prompt.name, "slug": prompt.slug(), **prompt.core_info()}

        blocks = list(
            map(
                lambda block: block.to_dict(exclude=["created_at", "updated_at"]),
                _blocks,
            )
        )

        prompts = list(map(process_prompt, _prompts))
        api_providers = list(
            map(
                lambda ap: ap.to_dict(exclude=["created_at", "updated_at"]),
                _api_providers,
            )
        )
        databases = list(
            map(
                lambda db: db.to_dict(exclude=["created_at", "updated_at"]),
                _databases,
            )
        )

        runbook = _runbook.to_dict(exclude=["created_at", "updated_at", "last_run"])
        runbook["blocks"] = blocks

        data = {
            "runbook": runbook,
            "prompts": prompts,
            "databases": databases,
            "api_providers": api_providers,
        }

        self.set_status(200)
        self.write(json.dumps(data))


class RunbooksAPIHandler(BaseMixin, tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop, **kwargs):
        super(RunbooksAPIHandler, self).initialize(loop)

    @tornado.web.authenticated
    def get(self):
        runbooks = Runbook.all()

        self.set_status(200)
        self.write(
            {
                "runbooks": runbooks,
            }
        )

    @tornado.web.authenticated
    def post(self):
        runbook_params = json_decode(self.request.body)["runbook"]

        try:
            runbook = Runbook.create(
                name=runbook_params.get("name"),
                description=runbook_params.get("description", ""),
                organization_id=Organization.first().id,
            )

            self.set_status(201)
            self.write(
                {"runbook": runbook.to_dict(exclude=["created_at", "updated_at"])}
            )
            return

        except sqlalchemy.exc.IntegrityError as e:
            err = "Unable to create runbook, name already exists."
            Base.session.rollback()

            self.set_status(422)
            self.write({"status": 422, "reason": err})
            return


class RunbooksAPIRun(BaseMixin, tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop, policy, host_keys_settings):
        super(RunbooksAPIRun, self).initialize(loop)
        logging.info(self.request)
        self.policy = policy
        self.host_keys_settings = host_keys_settings
        self.ssh_client = self._get_ssh_client()

    @tornado.web.authenticated
    def post(self, id):
        token = self.get_secure_cookie("token")

        runbook = Runbook.find(id)
        # Log runbook session
        ip, _ = self.get_client_addr()
        human_location = self.get_human_location(ip)
        log_entry = LogEntry.create(
            creator=self.get_current_user(),
            runbook=runbook,
            ip_address=ip,
            metadata_={"human_location": human_location, "record_output": True},
        )

        blocks = runbook.get_blocks()
        output_dict = {}
        context = {}

        self.set_secure_cookie("certificate_authentication", str(True))

        if self.request.body:
            params = json_decode(self.request.body)

        for block in blocks:
            match block.block_type:
                case "rest":
                    request = RESTProcessor(block).run()
                    # Will need to handle different content-types
                    val = request.json()
                    output_dict[block.id] = val
                    context[block.name] = json.dumps(val)
                    continue
                case "shell":
                    prompt = Prompt.get(block.data["prompt"])

                    if prompt is None:
                        self.set_status(422)
                        self.write(
                            {
                                "status": 422,
                                "reason": "Runbook run failed: target hostname/prompt not found",
                            }
                        )
                        return

                    prompt.context.session_id = self.session_id
                    command = TextProcessor.process(block.data["command"], context)

                    with tempfile.TemporaryDirectory() as temp_dir:
                        args = self._get_args(
                            token,
                            temp_dir,
                            {**prompt.core_info()},
                        )
                        ssh, _ = self.ssh_client.connect_with_jump(args)
                        _, stdout, stderr = ssh.exec_command(command)
                        out = stdout.read()
                        err = stderr.read()

                        output_dict[block.id] = {
                            "stdout": out.decode("utf-8"),
                            "stderr": err.decode("utf-8"),
                            "stdout_exit_status": stdout.channel.recv_exit_status(),
                            "stderr_exit_status": stderr.channel.recv_exit_status(),
                            "command": command,
                        }

                case "text":
                    continue
                case "form":
                    if not params:
                        continue

                    for key, value in params.get(str(block.id), {}).items():
                        if block.name not in context:
                            context[block.name] = {}
                        context[block.name][key] = value
                    continue
                case "database":
                    database = Database.find(block.data["database_id"])

                    # todo: support other databases/schemes
                    connection_string = "postgres://{username}:{password}@{host}:{port}/{database_name}".format(
                        username=database.username,
                        password=database.pw(),
                        host=database.host,
                        port=database.port,
                        database_name=database.name,
                    )

                    # note: use of TextProcessor means we can use "Cased-level" variable substition in the sql blocks
                    q = TextProcessor.process(block.data["query"], context)

                    # todo: as this stands, it requires `psql` (or whatever else database client we'll need)
                    #       to exist on the server running cased.. not terrible, but we'll need to bundle it
                    r = subprocess.run(
                        [
                            "psql",
                            connection_string,
                        ],
                        text=True,
                        input=q,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                    )
                    output_dict[block.id] = {
                        "output": r.stdout,
                        "exit_status": r.returncode,
                    }
                case _:
                    self.set_status(422)
                    self.write(
                        {
                            "status": 422,
                            "reason": "Runbook run failed: unsupported block type",
                        }
                    )
                    return

        metadata_copy = log_entry.metadata_.copy()
        metadata_copy.update(output_dict=output_dict)
        log_entry.update(metadata_=metadata_copy)

        # mark last successful run time
        runbook.mark_as_run()

        self.write({"result": output_dict})
