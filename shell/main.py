import logging
import tornado.web
import tornado.ioloop
import os
import subprocess

from tornado.options import options
from tornado.web import url
from shell import controllers


from shell.controllers import v2

from shell.controllers.v2 import (
    BaseMixin as V2BaseMixin,
    LogoutController as V2LogoutController,
    LoginController as V2LoginController,
    PingController as V2PingController,
    PubkeyController as V2PubkeyController,
    ApiPromptSessionsController as V2ApiPromptSessionsController,
    AuthController as V2AuthController,
    AuthCallbackController as V2AuthCallbackController,
    ApiCasedShellController as V2ApiCasedShellController,
    ApiDeveloperJwtController as V2ApiDeveloperJwtController,
    ApiDeveloperJwtRefreshController as V2ApiDeveloperJwtRefreshController,
    WebsocketPromptController as V2WebsocketPromptController,
    WebsocketShareController as V2WebsocketShareController,
    APIGitHubAuthController,
    APIPromptAccessController,
    APIDownloadsController,
    APIUploadsController,
    APISnippetsController,
    APIMetaController,
    api_runbooks_routes,
    api_providers_routes,
    api_databases_routes,
    api_groups_routes,
    api_users_routes,
    api_approvals_routes,
    api_approval_settings_routes,
    api_session_logs_routes,
    api_approval_check_routes,
    api_authorized_responders_routes,
    api_prompts_routes,
    api_login_routes,
    api_blocks_routes,
)

from shell.settings import (
    get_app_settings,
    get_host_keys_settings,
    get_policy_setting,
    get_ssl_context,
    get_server_settings,
    check_encoding_setting,
)


class NotFoundHandler(V2BaseMixin, tornado.web.ErrorHandler):
    def initialize(self):
        super(NotFoundHandler, self).initialize()

    def prepare(self):
        raise tornado.web.HTTPError(404)


class SettingsHandler(V2BaseMixin, tornado.web.RequestHandler):
    def initialize(self, loop):
        super(SettingsHandler, self).initialize(loop)

    def get(self):
        self.render(
            "settings.html",
        )


def make_handlers(loop, options):
    host_keys_settings = get_host_keys_settings(options)
    policy = get_policy_setting(options, host_keys_settings)

    handlers = [
        (r"/_ping", V2PingController, dict(loop=loop)),
        (r"/v2/_ping", V2PingController, dict(loop=loop)),
        (
            r"/v2/logout",
            V2LogoutController,
            dict(loop=loop),
        ),
        (
            r"/v2/login",
            V2LoginController,
            dict(loop=loop),
        ),
        (
            r"/v2/principal.txt",
            V2PubkeyController,
            dict(loop=loop, key="principal"),
        ),
        (
            r"/v2/.ssh/authorized_keys",
            V2PubkeyController,
            dict(loop=loop, key="authorized_keys"),
        ),
        *api_prompts_routes(loop=loop),
        *api_users_routes(loop=loop),
        *api_providers_routes(loop=loop),
        *api_databases_routes(loop=loop),
        *api_groups_routes(loop=loop),
        *api_approvals_routes(loop=loop),
        *api_approval_settings_routes(loop=loop),
        *api_session_logs_routes(loop=loop),
        *api_approval_check_routes(loop=loop),
        *api_authorized_responders_routes(loop=loop),
        *api_login_routes(loop=loop),
        *api_blocks_routes(loop=loop),
        *api_runbooks_routes(
            loop=loop, policy=policy, host_keys_settings=host_keys_settings
        ),
        (
            r"/v2/api/prompt-sessions",
            V2ApiPromptSessionsController,
            dict(loop=loop, policy=policy, host_keys_settings=host_keys_settings),
        ),
        (r"/v2/ws/share/([^/]+)", V2WebsocketShareController, dict(loop=loop)),
        (r"/v2/ws/([^/]+)/([^/]+)", V2WebsocketPromptController, dict(loop=loop)),
        (
            r"/api/casedshell",
            V2ApiCasedShellController,
            dict(loop=loop),
        ),
        (
            r"/api/prompt-access",
            APIPromptAccessController,
            dict(loop=loop),
        ),
        (
            r"/api/meta",
            APIMetaController,
            dict(loop=loop),
        ),
        (
            r"/api/github/app-manifest-conversion",
            APIGitHubAuthController,
            dict(loop=loop),
        ),
        (
            r"/v2/auth",
            V2AuthController,
            dict(loop=loop),
        ),
        (
            r"/v2/auth/callback",
            V2AuthCallbackController,
        ),
        (
            r"/v2/developer/jwt",
            V2ApiDeveloperJwtController,
            dict(loop=loop),
        ),
        (
            r"/v2/developer/refresh",
            V2ApiDeveloperJwtRefreshController,
            dict(loop=loop),
        ),
    ]

    return handlers


def make_app(handlers, settings):
    settings.update(default_handler_class=NotFoundHandler)
    return tornado.web.Application(handlers, **settings)


def app_listen(app, port, address, server_settings):
    app.listen(port, address, **server_settings)
    if not server_settings.get("ssl_options"):
        server_type = "http"
    else:
        server_type = "https"
        controllers.redirecting = True if options.redirect else False
    logging.info(
        "CasedShell Listening on {}:{} ({})".format(address, port, server_type)
    )


def main():

    options.parse_command_line()
    check_encoding_setting(options.encoding)

    loop = tornado.ioloop.IOLoop.current()
    app = make_app(make_handlers(loop, options), get_app_settings(options))

    ssl_ctx = get_ssl_context(options)
    server_settings = get_server_settings(options)

    # Run on defined port
    port = os.getenv("CASED_SHELL_PORT", "8888")
    print("Starting CasedShell server on port: {}".format(port))
    try:
        app_listen(app, port, options.address, server_settings)
    except:
        output = subprocess.run(["lsof", "-i", ":8888"], capture_output=True)
        if output.stdout:
            print(output.stdout)
            exit(1)

    # Run with ssl cert on 443
    if ssl_ctx:
        server_settings.update(ssl_options=ssl_ctx)
        app_listen(app, options.sslport, options.ssladdress, server_settings)

    # Run the web server. This blocks until a signal is received
    loop.start()


if __name__ == "__main__":
    main()
