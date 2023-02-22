from shell.controllers.v2.base_mixin import BaseMixin
from shell.controllers.v2.login_controller import LoginController
from shell.controllers.v2.logout_controller import LogoutController
from shell.controllers.v2.ping_controller import PingController
from shell.controllers.v2.pubkey_controller import PubkeyController

from shell.controllers.v2.api.prompt_sessions_controller import (
    ApiPromptSessionsController,
)
from shell.controllers.v2.api.websocket_prompt_controller import (
    WebsocketPromptController,
)
from shell.controllers.v2.api.websocket_share_controller import (
    WebsocketShareController,
)
from shell.controllers.v2.api.casedshell_controller import ApiCasedShellController

from shell.controllers.v2.api.developer_controller import (
    ApiDeveloperJwtController,
    ApiDeveloperJwtRefreshController,
)

from shell.controllers.v2.api.runbooks_controller import (
    api_routes as api_runbooks_routes,
)
from shell.controllers.v2.api.api_providers_controller import (
    routes as api_providers_routes,
)
from shell.controllers.v2.api.databases_controller import (
    routes as api_databases_routes,
)
from shell.controllers.v2.api.groups_controller import (
    routes as api_groups_routes,
)
from shell.controllers.v2.api.users_controller import (
    routes as api_users_routes,
)
from shell.controllers.v2.api.approvals_controller import (
    routes as api_approvals_routes,
)

from shell.controllers.v2.api.approval_settings_controller import (
    routes as api_approval_settings_routes,
)

from shell.controllers.v2.api.session_logs_controller import (
    routes as api_session_logs_routes,
)

from shell.controllers.v2.api.approval_check_controller import (
    routes as api_approval_check_routes,
)
from shell.controllers.v2.api.authorized_responders_controller import (
    routes as api_authorized_responders_routes,
)
from shell.controllers.v2.api.prompts_controller import (
    routes as api_prompts_routes,
)
from shell.controllers.v2.api.login_controller import (
    routes as api_login_routes,
)
from shell.controllers.v2.api.blocks_controller import (
    routes as api_blocks_routes,
)

from shell.controllers.v2.api.github_auth_controller import APIGitHubAuthController
from shell.controllers.v2.api.prompt_access_controller import APIPromptAccessController
from shell.controllers.v2.api.downloads_controller import APIDownloadsController
from shell.controllers.v2.api.uploads_controller import APIUploadsController
from shell.controllers.v2.api.snippets_controller import APISnippetsController
from shell.controllers.v2.api.meta_controller import APIMetaController
from shell.controllers.v2.auth_controller import AuthController, AuthCallbackController

redirecting = False
swallow_http_errors = True
DEFAULT_PORT = 22
