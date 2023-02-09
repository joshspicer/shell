from contextlib import contextmanager
import logging
import io
import jwt
import paramiko
import traceback
import os
import secrets
import traceback
import tornado
import uuid
import json
import hashlib
from io import BytesIO
import geocoder
from typing import Iterable
import re
from camel_converter import dict_to_camel

from datetime import datetime
from dateutil.tz import tzlocal
from tornado.options import options
from random import randint
import tornado.web
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from shell.cloudyblobject import (
    IDIndexedCloudyBlobject,
)
from shell.filters import getenv
from shell.models.casedshell import CasedShell
from shell.models.worker import clients

from shell.utils import (
    is_valid_ip_address,
    is_valid_port,
    is_valid_hostname,
    to_int,
)

try:
    from urllib.parse import urlparse
except ImportError:
    from urlparse import urlparse

from shell.utils import (
    get_stored_private_key,
    is_privkey_stored,
    is_ip_hostname,
    is_same_primary_domain,
    is_valid_port,
    to_bytes,
    to_int,
    to_ip_address,
    to_str,
    is_valid_encoding,
    human_time_duration,
    human_time_duration_v2,
    check_labels_match,
    get_ssh_passphrase,
)

from shell import controllers, ssh_client
from shell.models import (
    ApprovalSettings,
    CertificateAuthority,
    GroupAccess,
    Organization,
    Prompt,
    User,
    UserAccess,
    Program,
)

from shell.models.worker import Worker

from shell.errors import InvalidValueError
from shell.models.base import Base

from tornado.util import unicode_type
from tornado.escape import utf8


PRIVATE_KEYS = {}
BASH_PREEXEC = """
# bash-preexec.sh -- Bash support for ZSH-like 'preexec' and 'precmd' functions.
# https://github.com/rcaloras/bash-preexec
#
#
# 'preexec' functions are executed before each interactive command is
# executed, with the interactive command as its argument. The 'precmd'
# function is executed before each prompt is displayed.
#
# Author: Ryan Caloras (ryan@bashhub.com)
# Forked from Original Author: Glyph Lefkowitz
#
# V0.4.1
#

# General Usage:
#
#  1. Source this file at the end of your bash profile so as not to interfere
#     with anything else that's using PROMPT_COMMAND.
#
#  2. Add any precmd or preexec functions by appending them to their arrays:
#       e.g.
#       precmd_functions+=(my_precmd_function)
#       precmd_functions+=(some_other_precmd_function)
#
#       preexec_functions+=(my_preexec_function)
#
#  3. Consider changing anything using the DEBUG trap or PROMPT_COMMAND
#     to use preexec and precmd instead. Preexisting usages will be
#     preserved, but doing so manually may be less surprising.
#
#  Note: This module requires two Bash features which you must not otherwise be
#  using: the "DEBUG" trap, and the "PROMPT_COMMAND" variable. If you override
#  either of these after bash-preexec has been installed it will most likely break.

# Make sure this is bash that's running and return otherwise.
if [[ -z "${BASH_VERSION:-}" ]]; then
    return 1;
fi

# Avoid duplicate inclusion
if [[ -n "${bash_preexec_imported:-}" ]]; then
    return 0
fi
bash_preexec_imported="defined"

# WARNING: This variable is no longer used and should not be relied upon.
# Use ${bash_preexec_imported} instead.
__bp_imported="${bash_preexec_imported}"

# Should be available to each precmd and preexec
# functions, should they want it. $? and $_ are available as $? and $_, but
# $PIPESTATUS is available only in a copy, $BP_PIPESTATUS.
# TODO: Figure out how to restore PIPESTATUS before each precmd or preexec
# function.
__bp_last_ret_value="$?"
BP_PIPESTATUS=("${PIPESTATUS[@]}")
__bp_last_argument_prev_command="$_"

__bp_inside_precmd=0
__bp_inside_preexec=0

# Initial PROMPT_COMMAND string that is removed from PROMPT_COMMAND post __bp_install
__bp_install_string=$'__bp_trap_string="$(trap -p DEBUG)"\ntrap - DEBUG\n__bp_install'

# Fails if any of the given variables are readonly
# Reference https://stackoverflow.com/a/4441178
__bp_require_not_readonly() {
  local var
  for var; do
    if ! ( unset "$var" 2> /dev/null ); then
      echo "bash-preexec requires write access to ${var}" >&2
      return 1
    fi
  done
}

# Remove ignorespace and or replace ignoreboth from HISTCONTROL
# so we can accurately invoke preexec with a command from our
# history even if it starts with a space.
__bp_adjust_histcontrol() {
    local histcontrol
    histcontrol="${HISTCONTROL:-}"
    histcontrol="${histcontrol//ignorespace}"
    # Replace ignoreboth with ignoredups
    if [[ "$histcontrol" == *"ignoreboth"* ]]; then
        histcontrol="ignoredups:${histcontrol//ignoreboth}"
    fi;
    export HISTCONTROL="$histcontrol"
}

# This variable describes whether we are currently in "interactive mode";
# i.e. whether this shell has just executed a prompt and is waiting for user
# input.  It documents whether the current command invoked by the trace hook is
# run interactively by the user; it's set immediately after the prompt hook,
# and unset as soon as the trace hook is run.
__bp_preexec_interactive_mode=""

# These arrays are used to add functions to be run before, or after, prompts.
declare -a precmd_functions
declare -a preexec_functions

# Trims leading and trailing whitespace from $2 and writes it to the variable
# name passed as $1
__bp_trim_whitespace() {
    local var=${1:?} text=${2:-}
    text="${text#"${text%%[![:space:]]*}"}"   # remove leading whitespace characters
    text="${text%"${text##*[![:space:]]}"}"   # remove trailing whitespace characters
    printf -v "$var" '%s' "$text"
}


# Trims whitespace and removes any leading or trailing semicolons from $2 and
# writes the resulting string to the variable name passed as $1. Used for
# manipulating substrings in PROMPT_COMMAND
__bp_sanitize_string() {
    local var=${1:?} text=${2:-} sanitized
    __bp_trim_whitespace sanitized "$text"
    sanitized=${sanitized%;}
    sanitized=${sanitized#;}
    __bp_trim_whitespace sanitized "$sanitized"
    printf -v "$var" '%s' "$sanitized"
}

# This function is installed as part of the PROMPT_COMMAND;
# It sets a variable to indicate that the prompt was just displayed,
# to allow the DEBUG trap to know that the next command is likely interactive.
__bp_interactive_mode() {
    __bp_preexec_interactive_mode="on";
}


# This function is installed as part of the PROMPT_COMMAND.
# It will invoke any functions defined in the precmd_functions array.
__bp_precmd_invoke_cmd() {
    # Save the returned value from our last command, and from each process in
    # its pipeline. Note: this MUST be the first thing done in this function.
    __bp_last_ret_value="$?" BP_PIPESTATUS=("${PIPESTATUS[@]}")

    # Don't invoke precmds if we are inside an execution of an "original
    # prompt command" by another precmd execution loop. This avoids infinite
    # recursion.
    if (( __bp_inside_precmd > 0 )); then
      return
    fi
    local __bp_inside_precmd=1

    # Invoke every function defined in our function array.
    local precmd_function
    for precmd_function in "${precmd_functions[@]}"; do

        # Only execute this function if it actually exists.
        # Test existence of functions with: declare -[Ff]
        if type -t "$precmd_function" 1>/dev/null; then
            __bp_set_ret_value "$__bp_last_ret_value" "$__bp_last_argument_prev_command"
            # Quote our function invocation to prevent issues with IFS
            "$precmd_function"
        fi
    done
}

# Sets a return value in $?. We may want to get access to the $? variable in our
# precmd functions. This is available for instance in zsh. We can simulate it in bash
# by setting the value here.
__bp_set_ret_value() {
    return ${1:-}
}

__bp_in_prompt_command() {

    local prompt_command_array
    IFS=$'\n;' read -rd '' -a prompt_command_array <<< "${PROMPT_COMMAND:-}"

    local trimmed_arg
    __bp_trim_whitespace trimmed_arg "${1:-}"

    local command trimmed_command
    for command in "${prompt_command_array[@]:-}"; do
        __bp_trim_whitespace trimmed_command "$command"
        if [[ "$trimmed_command" == "$trimmed_arg" ]]; then
            return 0
        fi
    done

    return 1
}

# This function is installed as the DEBUG trap.  It is invoked before each
# interactive prompt display.  Its purpose is to inspect the current
# environment to attempt to detect if the current command is being invoked
# interactively, and invoke 'preexec' if so.
__bp_preexec_invoke_exec() {

    # Save the contents of $_ so that it can be restored later on.
    # https://stackoverflow.com/questions/40944532/bash-preserve-in-a-debug-trap#40944702
    __bp_last_argument_prev_command="${1:-}"
    # Don't invoke preexecs if we are inside of another preexec.
    if (( __bp_inside_preexec > 0 )); then
      return
    fi
    local __bp_inside_preexec=1

    # Checks if the file descriptor is not standard out (i.e. '1')
    # __bp_delay_install checks if we're in test. Needed for bats to run.
    # Prevents preexec from being invoked for functions in PS1
    if [[ ! -t 1 && -z "${__bp_delay_install:-}" ]]; then
        return
    fi

    if [[ -n "${COMP_LINE:-}" ]]; then
        # We're in the middle of a completer. This obviously can't be
        # an interactively issued command.
        return
    fi
    if [[ -z "${__bp_preexec_interactive_mode:-}" ]]; then
        # We're doing something related to displaying the prompt.  Let the
        # prompt set the title instead of me.
        return
    else
        # If we're in a subshell, then the prompt won't be re-displayed to put
        # us back into interactive mode, so let's not set the variable back.
        # In other words, if you have a subshell like
        #   (sleep 1; sleep 2)
        # You want to see the 'sleep 2' as a set_command_title as well.
        if [[ 0 -eq "${BASH_SUBSHELL:-}" ]]; then
            __bp_preexec_interactive_mode=""
        fi
    fi

    if  __bp_in_prompt_command "${BASH_COMMAND:-}"; then
        # If we're executing something inside our prompt_command then we don't
        # want to call preexec. Bash prior to 3.1 can't detect this at all :/
        __bp_preexec_interactive_mode=""
        return
    fi

    local this_command
    this_command=$(
        export LC_ALL=C
        HISTTIMEFORMAT= builtin history 1 | sed '1 s/^ *[0-9][0-9]*[* ] //'
    )

    # Sanity check to make sure we have something to invoke our function with.
    if [[ -z "$this_command" ]]; then
        return
    fi

    # Invoke every function defined in our function array.
    local preexec_function
    local preexec_function_ret_value
    local preexec_ret_value=0
    for preexec_function in "${preexec_functions[@]:-}"; do

        # Only execute each function if it actually exists.
        # Test existence of function with: declare -[fF]
        if type -t "$preexec_function" 1>/dev/null; then
            __bp_set_ret_value ${__bp_last_ret_value:-}
            # Quote our function invocation to prevent issues with IFS
            "$preexec_function" "$this_command"
            preexec_function_ret_value="$?"
            if [[ "$preexec_function_ret_value" != 0 ]]; then
                preexec_ret_value="$preexec_function_ret_value"
            fi
        fi
    done

    # Restore the last argument of the last executed command, and set the return
    # value of the DEBUG trap to be the return code of the last preexec function
    # to return an error.
    # If `extdebug` is enabled a non-zero return value from any preexec function
    # will cause the user's command not to execute.
    # Run `shopt -s extdebug` to enable
    __bp_set_ret_value "$preexec_ret_value" "$__bp_last_argument_prev_command"
}

__bp_install() {
    # Exit if we already have this installed.
    if [[ "${PROMPT_COMMAND:-}" == *"__bp_precmd_invoke_cmd"* ]]; then
        return 1;
    fi

    trap '__bp_preexec_invoke_exec "$_"' DEBUG

    # Preserve any prior DEBUG trap as a preexec function
    local prior_trap=$(sed "s/[^']*'\(.*\)'[^']*/\1/" <<<"${__bp_trap_string:-}")
    unset __bp_trap_string
    if [[ -n "$prior_trap" ]]; then
        eval '__bp_original_debug_trap() {
          '"$prior_trap"'
        }'
        preexec_functions+=(__bp_original_debug_trap)
    fi

    # Adjust our HISTCONTROL Variable if needed.
    __bp_adjust_histcontrol

    # Issue #25. Setting debug trap for subshells causes sessions to exit for
    # backgrounded subshell commands (e.g. (pwd)& ). Believe this is a bug in Bash.
    #
    # Disabling this by default. It can be enabled by setting this variable.
    if [[ -n "${__bp_enable_subshells:-}" ]]; then

        # Set so debug trap will work be invoked in subshells.
        set -o functrace > /dev/null 2>&1
        shopt -s extdebug > /dev/null 2>&1
    fi;

    local existing_prompt_command
    # Remove setting our trap install string and sanitize the existing prompt command string
    existing_prompt_command="${PROMPT_COMMAND:-}"
    existing_prompt_command="${existing_prompt_command//$__bp_install_string[;$'\n']}" # Edge case of appending to PROMPT_COMMAND
    existing_prompt_command="${existing_prompt_command//$__bp_install_string}"
    __bp_sanitize_string existing_prompt_command "$existing_prompt_command"

    # Install our hooks in PROMPT_COMMAND to allow our trap to know when we've
    # actually entered something.
    PROMPT_COMMAND=$'__bp_precmd_invoke_cmd\n'
    if [[ -n "$existing_prompt_command" ]]; then
        PROMPT_COMMAND+=${existing_prompt_command}$'\n'
    fi;
    PROMPT_COMMAND+='__bp_interactive_mode'

    # Add two functions to our arrays for convenience
    # of definition.
    precmd_functions+=(precmd)
    preexec_functions+=(preexec)

    # Invoke our two functions manually that were added to $PROMPT_COMMAND
    __bp_precmd_invoke_cmd
    __bp_interactive_mode
}

# Sets an installation string as part of our PROMPT_COMMAND to install
# after our session has started. This allows bash-preexec to be included
# at any point in our bash profile.
__bp_install_after_session_init() {
    # bash-preexec needs to modify these variables in order to work correctly
    # if it can't, just stop the installation
    __bp_require_not_readonly PROMPT_COMMAND HISTCONTROL HISTTIMEFORMAT || return

    local sanitized_prompt_command
    __bp_sanitize_string sanitized_prompt_command "${PROMPT_COMMAND:-}"
    if [[ -n "$sanitized_prompt_command" ]]; then
        PROMPT_COMMAND=${sanitized_prompt_command}$'\n'
    fi;
    PROMPT_COMMAND+=${__bp_install_string}
}

# Run our install so long as we're not delaying it.
if [[ -z "${__bp_delay_install:-}" ]]; then
    __bp_install_after_session_init
fi;"""


class PrivateKey(object):

    max_length = 16384  # rough number

    tag_to_name = {"RSA": "RSA", "DSA": "DSS", "EC": "ECDSA", "OPENSSH": "Ed25519"}

    def __init__(self, privatekey, password=None, filename=""):
        self.privatekey = privatekey
        self.filename = filename
        self.password = password
        self.check_length()
        self.iostr = io.StringIO(privatekey)
        self.last_exception = None

    def check_length(self):
        if len(self.privatekey) > self.max_length:
            raise InvalidValueError("Invalid key length.")

    def parse_name(self, iostr, tag_to_name):
        name = None
        for line_ in iostr:
            line = line_.strip()
            if (
                line
                and line.startswith("-----BEGIN ")
                and line.endswith(" PRIVATE KEY-----")
            ):
                lst = line.split(" ")
                if len(lst) == 4:
                    tag = lst[1]
                    if tag:
                        name = tag_to_name.get(tag)
                        if name:
                            break
        return name, len(line_)

    def get_specific_pkey(self, name, offset, password):
        self.iostr.seek(offset)
        logging.debug("Reset offset to {}.".format(offset))

        logging.debug("Try parsing it as {} type key".format(name))
        pkeycls = getattr(paramiko, name + "Key")
        pkey = None

        try:
            pkey = pkeycls.from_private_key(self.iostr, password=password)
        except paramiko.PasswordRequiredException:
            raise InvalidValueError("Need a passphrase to decrypt the key.")
        except (paramiko.SSHException, ValueError) as exc:
            self.last_exception = exc
            logging.debug(str(exc))

        return pkey

    def get_pkey_obj(self):
        logging.info("Parsing private key {!r}".format(self.filename))
        name, length = self.parse_name(self.iostr, self.tag_to_name)
        if not name:
            raise InvalidValueError("Invalid key {}.".format(self.filename))

        offset = self.iostr.tell() - length
        password = to_bytes(self.password) if self.password else None
        pkey = self.get_specific_pkey(name, offset, password)

        if pkey is None and name == "Ed25519":
            for name in ["RSA", "ECDSA", "DSS"]:
                pkey = self.get_specific_pkey(name, offset, password)
                if pkey:
                    break

        if pkey:
            return pkey

        logging.error(str(self.last_exception))
        msg = "Invalid key"
        if self.password:
            msg += ' or wrong passphrase "{}" for decrypting it.'.format(self.password)
        raise InvalidValueError(msg)


class BaseMixin(object):

    custom_headers = {"Server": "CasedShell"}

    html = (
        "<html><head><title>{code} {reason}</title></head><body>{code} "
        "{reason}</body></html>"
    )

    default_origin_policy = "same"
    origin_policy = default_origin_policy

    OPENID_ENDPOINT = "https://{}/idp".format(
        os.getenv("CASED_SHELL_HOSTNAME", "example.com")
    )
    REDIRECT_URL = "https://{}/v2/auth/callback".format(
        os.getenv("CASED_SHELL_HOSTNAME", "example.com")
    )
    OPENID_TOKEN_ENDPOINT = "{}/token".format(OPENID_ENDPOINT)
    CERTS_URL = "{}/keys".format(OPENID_ENDPOINT)

    OAUTH_CLIENT_ID = os.getenv("CASED_SHELL_OAUTH_CLIENT_ID", "cased-shell")
    OAUTH_CLI_CLIENT_ID = os.getenv("CASED_SHELL_CLI_OAUTH_CLIENT_ID", "cased-cli")
    OAUTH_CLIENT_IDS = [
        OAUTH_CLIENT_ID,
        OAUTH_CLI_CLIENT_ID,
    ]
    OAUTH_CLIENT_SECRET = os.getenv(
        "CASED_SHELL_OAUTH_CLIENT_SECRET", "cased-shell-secret"
    )

    jwks_client = jwt.PyJWKClient(CERTS_URL)

    def initialize(self, loop=None):
        logging.debug(str(self.request))
        logging.info("clients: %s" % clients)
        self.check_request()
        self.loop = loop

        self.token, self.token_source = self._get_token()
        self.validated_token = None
        self.session_id = self._get_session_id()
        self.args = {}

    def prepare(self):
        self.set_secure_cookie("session_id", self.session_id)
        IDIndexedCloudyBlobject.clear_cache()

        if self.request.method == "POST":
            if (
                self.request.headers.get("Content-Type")
                == "application/x-www-form-urlencoded"
            ):
                for key in self.request.body_arguments:
                    self.args[key] = self.get_body_argument(key)

    def write_error(self, status_code, **kwargs):
        if status_code in [500, 503]:
            _trace = traceback.format_exception(*kwargs["exc_info"])
            trace = "\n".join(_trace)

            self.render(
                "500.html",
                status_code=status_code,
                trace=trace,
            )
        elif status_code in [404]:
            self.write("404: Not Found")
        else:
            self.write("Error: " + str(status_code))

    def _get_session_id(self):
        cookie = self.get_secure_cookie("session_id")
        if cookie is not None:
            logging.info(f"Continuing session: {cookie}")
            return to_str(cookie)

        # session-id may come from external API users
        if self.token_source == "header-auth-bearer":
            sid = self.request.headers.get("X-SESSION-ID", None)
            if sid is not None:
                logging.info(f"Continuing session (API): {sid}")
                return to_str(sid)

        new_id = uuid.uuid4()
        logging.info(f"Starting new session: {new_id}")
        return str(new_id)

    def _get_ssh_client(self):
        ssh = ssh_client.SSHClient()
        ssh._system_host_keys = self.host_keys_settings["system_host_keys"]
        ssh._host_keys = self.host_keys_settings["host_keys"]
        ssh._host_keys_filename = self.host_keys_settings["host_keys_filename"]
        ssh.set_missing_host_key_policy(self.policy)

        return ssh

    def static_url(self, path):
        return tornado.web.RequestHandler.static_url(
            self, path=path, include_host=False
        )

    def render_template(self, template_name, **kwargs):
        """
        Prefer this over #render
        """
        template_dirs = []
        if self.settings.get("template_path", ""):
            template_dirs.append(self.settings["template_path"])

        env = Environment(loader=FileSystemLoader(template_dirs), autoescape=True)
        env.filters["getenv"] = getenv
        env.filters["static_url"] = self.static_url

        try:
            template = env.get_template(template_name)
        except TemplateNotFound:
            raise TemplateNotFound(template_name)
        content = template.render(kwargs)
        return content

    def render_html(self, template_name, skip_user=False, **kwargs):
        kwargs.update(
            {
                "is_rendered": True,
                "hostname": os.getenv("CASED_SHELL_HOSTNAME", ""),
                "random_color": self.random_color,
                "human_date": self.human_date,
                "human_time_duration": human_time_duration,
                "human_time_duration_v2": human_time_duration_v2,
                "xsrf_form_html": self.xsrf_form_html,
                "current_user": self.get_current_user(),
                "organization": self.current_organization(),
                "org_settings": self._get_org_settings(),
            }
        )

        if not skip_user:
            kwargs.update(
                {
                    "role": self._get_user_role(),
                }
            )

        content = self.render_template(template_name, **kwargs)
        self.write(content)

    def random_color(self):
        _rand = randint(0, 5)
        random_color = self.color_theme_alice(_rand)
        return random_color

    def _username_from_token(self, token):
        cased_secret = os.getenv("JWT_SIGNING_KEY", "insecure")

        try:
            token = token.encode()
        except:
            pass

        try:
            decoded = jwt.decode(token, cased_secret, algorithms=["HS256"])
        except jwt.exceptions.InvalidSignatureError:
            self.redirect("/logout")
            return

        user = decoded.get("user")
        if not user:
            raise Exception("No user was found in the decoded jwt data")
        return user

    def _user_id_from_token(self, token):
        if self.token_source == "header-auth-bearer":
            id_token = self._validate_oidc_token(token)
            user = User.find_by_validated_access_token(id_token)
            if not user:
                raise Exception("No user found")
            return user.id
        else:
            cased_secret = os.getenv("JWT_SIGNING_KEY", "insecure")

            try:
                token = token.encode()
            except:
                pass

            try:
                decoded = jwt.decode(token, cased_secret, algorithms=["HS256"])
            except jwt.exceptions.InvalidSignatureError:
                self.redirect("/v2/logout")
                return

            user_id = decoded.get("user_id")

            if not user_id:
                raise Exception("No user id was found in the decoded jwt data")
            return user_id

    def _get_hostname(self):
        return os.getenv("CASED_SHELL_HOSTNAME", "")

    def _get_org_settings(self):
        return {
            "hostname": self._get_hostname(),
            "organization": self.current_organization(),
        }

    def _nuke_session_and_redirect_due_to(self, e):
        logging.error(str(e))
        self.clear_cookie("token")
        self.clear_cookie("session_id")
        self.redirect("/v2/logout")
        return

    # Validates an OIDC ID or Access Token and returns a dict with the claims.
    def _validate_oidc_token(self, token: str) -> dict:
        signing_key = self.__class__.jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=self.__class__.OPENID_ENDPOINT,
            audience=self.__class__.OAUTH_CLIENT_IDS,
            leeway=30,
        )

        # TODO validate at_hash once https://github.com/jpadilla/pyjwt/commit/00cd759d86aae24176ead7bdbed273a07532443e is released

        return payload

    def _get_token(self):
        src = None
        token = self.get_secure_cookie("token")
        if token:
            src = "cookie"
        else:
            token = self.request.headers.get("Token")
            if token:
                src = "header-token"
                token = token.encode("utf-8")
            else:
                tokens = self.request.headers.get("Authorization", "").split()
                if len(tokens) == 2 and tokens[0] == "Bearer":
                    src = "header-auth-bearer"
                    token = tokens[1]

        return token, src

    def check_xsrf_cookie(self) -> None:
        # Don't use csrf protection on public APIs.
        if self.token_source != "header-auth-bearer":
            super().check_xsrf_cookie()

    def _get_user_role(self):
        _role = self._role_from_token(self.token)

        if not _role:
            logging.info("Role not found from token. Logging out.")
            self.redirect("/v2/logout")
            return

        role = tornado.escape.xhtml_escape(_role)
        return role

    def _role_from_token(self, token):
        if self.token_source == "header-auth-bearer":
            id_token = self._validate_oidc_token(token)
            user = User.find_by_validated_access_token(id_token)
            if not user:
                self.redirect("/v2/logout")
                return
            return user.role
        else:
            cased_secret = os.getenv("JWT_SIGNING_KEY", "insecure")

            try:
                token = token.encode()
            except:
                pass

            try:
                decoded = jwt.decode(token, cased_secret, algorithms=["HS256"])
            except jwt.exceptions.InvalidSignatureError:
                self.redirect("/v2/logout")
                return

            return decoded.get("role")

    def get_current_user(self):
        if self.token and self.validate_jwt(self.token):
            user_id = self._user_id_from_token(self.token)
            return User.find(user_id)
        else:
            return None

    @property
    def current_organization(self):
        return self.get_current_organization

    def get_current_organization(self):
        return Organization.all()[0]

    @property
    def current_casedshell(self):
        return self.get_current_casedshell

    def get_current_casedshell(self):
        return CasedShell.all()[0]

    def set_token(self, token):
        # validate jwt and set it
        if self.expired_jwt(token):
            self.redirect("/v2/logout")
            return False
        elif self.validate_jwt(token):
            self.set_secure_cookie("token", token)
            self.set_cookie("access_token", token)
            return True
        else:
            logging.error("Invalid JWT.")
            self.redirect("/v2/logout")
            return False

    def check_request(self):
        context = self.request.connection.context
        result = self.is_forbidden(context, self.request.host_name)
        self._transforms = []
        if result:
            self.set_status(403)
            self.finish(self.html.format(code=self._status_code, reason=self._reason))
        elif result is False:
            to_url = self.get_redirect_url(
                self.request.host_name, options.sslport, self.request.uri
            )
            self.redirect(to_url, permanent=True)
        else:
            self.context = context  # hostname

    def check_origin(self, origin):
        if self.origin_policy == "*":
            return True

        parsed_origin = urlparse(origin)
        netloc = parsed_origin.netloc.lower()
        logging.debug("netloc: {}".format(netloc))

        host = self.request.headers.get("Host")
        logging.debug("host: {}".format(host))

        if netloc == host:
            return True

        if self.origin_policy == "same":
            return False
        elif self.origin_policy == "primary":
            return is_same_primary_domain(
                netloc.rsplit(":", 1)[0], host.rsplit(":", 1)[0]
            )
        else:
            return origin in self.origin_policy

    def is_forbidden(self, context, hostname):
        ip = context.address[0]
        lst = context.trusted_downstream
        ip_address = None

        if lst and ip not in lst:
            logging.warning(
                "IP {!r} not found in trusted downstream {!r}".format(ip, lst)
            )
            return True

        if context._orig_protocol == "http":
            if controllers.redirecting and not is_ip_hostname(hostname):
                ip_address = to_ip_address(ip)
                if not ip_address.is_private:
                    # redirecting
                    return False

            if options.fbidhttp:
                if ip_address is None:
                    ip_address = to_ip_address(ip)
                if not ip_address.is_private:
                    logging.warning("Public plain http request is forbidden.")
                    return True

    def validate_jwt(self, token):
        try:
            if self.token_source == "header-auth-bearer":
                payload = self._validate_oidc_token(token)
                logging.info("payload: %s", payload)
                if payload["sub"]:
                    return True
                else:
                    return False
            else:
                cased_secret = os.getenv("JWT_SIGNING_KEY", "insecure")
                decoded = jwt.decode(token, cased_secret, algorithms=["HS256"])
                return True
        except (
            jwt.exceptions.InvalidSignatureError,
            jwt.exceptions.ExpiredSignatureError,
            jwt.exceptions.DecodeError,
        ):
            return False

    def _check_token(self, token):
        if self.validate_jwt(token):
            return True
        else:
            logging.error("Invalid token, refusing to continue.")
            return False

    def expired_jwt(self, token):
        cased_secret = os.getenv("JWT_SIGNING_KEY", "insecure")
        try:
            jwt.decode(token, cased_secret, algorithms=["HS256"])
            return False
        except jwt.exceptions.ExpiredSignatureError:
            return True
        except:
            return False

    def get_redirect_url(self, hostname, port, uri):
        port = "" if port == 443 else ":%s" % port
        return "https://{}{}{}".format(hostname, port, uri)

    def options(self, *args):
        self.set_default_headers()
        # no body
        self.set_status(204)
        self.finish()

    def set_default_headers(self):
        for header in self.custom_headers.items():
            self.set_header(*header)

        origin = self.request.headers.get("Origin")
        if origin:
            if os.getenv("ALLOWED_ORIGINS"):
                self.origin_policy = os.getenv("ALLOWED_ORIGINS").split(",")

            if not self.check_origin(origin):
                raise tornado.web.HTTPError(
                    403, "Cross origin operation is not allowed."
                )
            if self.origin_policy != "same":
                self.set_header(
                    "Access-Control-Allow-Headers",
                    "x-requested-with,access-control-allow-origin,authorization,content-type,token",
                )
                self.set_header(
                    "Access-Control-Allow-Methods",
                    "POST, GET, OPTIONS, PATCH, PUT, DELETE",
                )
                self.set_header("Access-Control-Allow-Origin", origin)

    def get_value(self, name):
        value = self.get_argument(name)
        if not value:
            raise InvalidValueError("Please enter your {}".format(name))
        return value

    def get_context_addr(self):
        return self.context.address[:2]

    def get_client_addr(self):
        if options.xheaders:
            return self.get_real_client_addr() or self.get_context_addr()
        else:
            return self.get_context_addr()

    def _get_args(self, token, temp_dir, data):
        hostname = data["hostname"]
        hostname = hostname.split(" ")[0]
        if not (is_valid_hostname(hostname) or is_valid_ip_address(hostname)):
            raise InvalidValueError("Invalid hostname: {}".format(hostname))

        port = data.get("port") or ""
        if not port:
            port = 22
        port = to_int(port)
        if port is None or not is_valid_port(port):
            raise InvalidValueError("Invalid port: {}".format(port))

        username = data.get("username", "")
        if username is None:
            raise "Username is missing"
        password = data.get("password", "")
        totp = data.get("topt", "")

        if isinstance(self.policy, paramiko.RejectPolicy):
            self._lookup_hostname(hostname, port)

        pkey = self.get_pkey(token, temp_dir)

        self.ssh_client.totp = totp
        args = (hostname, port, username, password, pkey, self.session_id)

        return args

    def get_real_client_addr(self):
        ip = self.request.remote_ip

        if ip == self.request.headers.get("X-Real-Ip"):
            port = self.request.headers.get("X-Real-Port")
        elif ip in self.request.headers.get("X-Forwarded-For", ""):
            port = self.request.headers.get("X-Forwarded-Port")
        else:
            # not running behind an nginx server
            return

        port = to_int(port)
        if port is None or not is_valid_port(port):
            # fake port
            port = 65535

        return (ip, port)

    def _is_certificate_authentication_enabled(self):
        return CasedShell.first().ca_enabled

    def get_certificate_pkey(self, token, temp_dir):
        logging.info("Attempting to obtain a certificate")
        ca = CertificateAuthority.primary()

        username = self.get_current_user().name
        principals = CertificateAuthority.principals(username)
        cert_data, key_data = ca.generate_keypair(principals)

        logging.info(
            "Obtained keypair for {!r}, cert len {!r} and key len {!r}".format(
                principals, len(cert_data), len(key_data)
            )
        )
        # convert the sessionID into something that can be used as a filename
        short_session_id = hashlib.sha256(self.session_id.encode("ascii")).hexdigest()
        # This path name is important to paramiko's cert loading functionality
        cert_path = "{}/{}-cert.pub".format(temp_dir, short_session_id)
        cert = open(cert_path, "w")
        cert.write(cert_data)
        cert.close()
        key_path = "{}/{}".format(temp_dir, short_session_id)
        key = open(key_path, "w")
        key.write(key_data)
        key.close()

        ecdsakey = paramiko.ECDSAKey.from_private_key_file(key_path, None)
        ecdsakey.load_certificate(cert_path)
        return ecdsakey

    def cache_pkey(self, pkey):
        # write the pkey to PRIVATE_KEYS, using a secure token as the key
        cs_token = secrets.token_hex(20)
        PRIVATE_KEYS[cs_token] = pkey
        self.set_secure_cookie("cs_token", cs_token)

    def get_pkey(self, token, temp_dir):
        privatekey, filename = self.get_privatekey()
        # TODO: ensure all callsites include this arg if necessary
        passphrase = self.get_argument("passphrase", "")
        pkey = None

        if privatekey:
            pkey = PrivateKey(privatekey, passphrase, filename).get_pkey_obj()
            self.cache_pkey(pkey)

        elif is_privkey_stored():
            stored_private_key = get_stored_private_key()
            pkey = PrivateKey(stored_private_key, passphrase, filename).get_pkey_obj()

        elif self._is_certificate_authentication_enabled():
            pkey = self.get_certificate_pkey(token, temp_dir)
            self.cache_pkey(pkey)

        elif self.get_secure_cookie("cs_token") is not None:
            logging.info("Using uploaded private key.")
            try:
                cased_secure_token = self.get_secure_cookie("cs_token").decode("utf-8")
            except:
                cased_secure_token = self.get_secure_cookie("cs_token")
            private_key = PRIVATE_KEYS.get(cased_secure_token)

        return pkey

    def get_privatekey(self):
        name = "privatekey"
        lst = self.request.files.get(name)

        if lst:
            # multipart form
            filename = lst[0]["filename"]
            data = lst[0]["body"]
            value = self.decode_argument(data, name=name).strip()
        else:
            # urlencoded form
            value = self.get_argument(name, "")
            filename = ""

        return value, filename

    def _parse_encoding(self, data):
        try:
            encoding = to_str(data.strip(), "ascii")
        except UnicodeDecodeError:
            return

        if is_valid_encoding(encoding):
            return encoding

    def _get_default_encoding(self, ssh):
        commands = ['$SHELL -ilc "locale charmap"', '$SHELL -ic "locale charmap"']

        for command in commands:
            try:
                # Don't request a PTY. This allows servers to drop this command
                # if they require non-standard interactive session initialization.
                _, stdout, _ = ssh.exec_command(command, get_pty=False, timeout=3)
            except paramiko.SSHException as exc:
                logging.info(str(exc))
            else:
                try:
                    data = stdout.read()
                except Exception as exc:
                    logging.info(str(exc))
                else:
                    logging.debug("{!r} => {!r}".format(command, data))
                    result = self._parse_encoding(data)
                    if result:
                        return result

        logging.warning("Could not detect the default encoding.")
        return "utf-8"

    def _get_shell_name(self, ssh):
        command = "echo $SHELL"

        try:
            _, stdout, _ = ssh.exec_command(command, get_pty=False, timeout=3)
        except paramiko.SSHException as exc:
            logging.info(str(exc))
        else:
            try:
                data = stdout.read()
            except Exception as exc:
                logging.info(str(exc))
            else:
                logging.debug("{!r} => {!r}".format(command, data))
                result = self._parse_encoding(data)
                if result:
                    return result

        logging.warning("Could not detect the default encoding.")
        return "bash"

    def _ssh_connect_to_worker(self, args, initial_command, close_terminal_on_exit):
        dst_addr = args[:2]
        session_id = args[-1]
        worker = Worker(
            self.loop, None, [], dst_addr, session_id, close_terminal_on_exit
        )
        worker.ssh_client = self.ssh_client
        worker.connect_and_try_to_auth(args)
        if worker.authentication_completed:
            return self.finish_worker(worker, initial_command)
        else:
            return worker

    def finish_worker(self, worker, initial_command):

        term = self.get_argument("term", "") or "xterm"
        chan = (
            worker.ssh_client.invoke_shell(term=term)
            if initial_command is None
            else worker.ssh_client.exec_command_chan(initial_command, term=term)
        )

        worker.add_chan(chan)

        worker.encoding = (
            options.encoding
            if options.encoding
            else self._get_default_encoding(worker.ssh_client)
        )

        approval_commands = self.get_v2_approval_programs_commands()
        print(approval_commands)
        if (
            initial_command is None
            and approval_commands is not None
            and len(approval_commands) > 0
        ):
            shell_name = self._get_shell_name(worker.ssh_client)
            print("Sending {}-prexec over SFTP".format(shell_name))
            sftp = worker.ssh_client.open_sftp()
            sftp.putfo(BytesIO(BASH_PREEXEC.encode()), ".bash-preexec.sh")
            sftp.close()
            print("Sent bash-prexec")

            worker.inject_approval_commands(shell_name)

        return worker

    def _get_prompts(self):
        reason_required = self.get_current_casedshell().reason_required

        prompts = Prompt.list(
            session_id=self.session_id,
            reason_required=reason_required,
            key_stored=is_privkey_stored(),
            ssh_passphrase=get_ssh_passphrase(),
            certificate_authentication=self._is_certificate_authentication_enabled(),
            one_click_auth=True,
        )

        for prompt in prompts:
            prompt.context.need_access = not self._check_user_access_to_this_prompt(
                prompt.labels
            )

        return prompts

    def _get_labels_from_prompts(self):
        prompts = self._get_prompts()
        prompts_labels = [prompt.labels for prompt in prompts]
        result = []
        for prompt_labels in prompts_labels:
            for key, value in prompt_labels.items():
                item = {key: value}
                if item not in result:
                    result.append(item)
        return result

    def _get_approval_settings_from_prompts(self):
        prompts = self._get_labels_from_prompts()
        approval_settings = []
        for _prompt in prompts:
            prompt = json.dumps(_prompt)
            _approval_setting = ApprovalSettings().find_by(prompt=prompt)
            if len(_approval_setting) > 0:
                approval_setting = _approval_setting[0]
            else:
                approval_setting = ApprovalSettings.create(
                    prompt=prompt, reason_required=False
                )
            approval_settings.append(approval_setting)

        return sorted(approval_settings, key=lambda i: i.prompt)

    @contextmanager
    def _ssh_connect_context(self, args, proxy_jump=None):
        ssh, closers = self.ssh_client.connect_with_jump(args, proxy_jump=proxy_jump)
        try:
            yield ssh
        finally:
            for c in reversed(closers):
                if c is not None:
                    c.close()

    def human_date(self, date):
        if not date:
            return "Never"

        if isinstance(date, datetime):
            return date.strftime("%H:%M %b %-d")

        return datetime.utcfromtimestamp(date).strftime("%H:%M %b %-d")

    def api_expiration_options_for_select(self):
        return [
            ["immediate", "immediately"],
            ["hour", "in 1 hour"],
            ["day", "in 1 day"],
            ["week", "in 1 week"],
            ["month", "in 1 month"],
        ]

    def color_theme_alice(self, idx):
        return [
            "from-blue-600 to-purple-400",
            "from-sky-400 to-green-400",
            "from-red-600 to-orange-400",
            "from-purple-300 to-purple-500",
            "from-green-300 to-green-700",
            "from-yellow-300 to-red-400",
        ][idx]

    def color_theme_bob(self, idx):
        return [
            "from-yellow-300 to-red-400",
            "from-purple-300 to-purple-500",
            "from-green-300 to-green-700",
        ][idx]

    def _get_organization_users(self):
        organization_users = self.get_current_organization().users

        return organization_users

    def _get_organization_groups(self):
        organization_groups = self.get_current_organization().groups

        return organization_groups

    def _lookup_user_email(self, user_id=None, email=None):
        organization_users = self._get_organization_users()

        if user_id:
            result = next(
                (x for x in organization_users if x.get("id") == user_id),
                {"email": "-"},
            ).get("email")

        if email:
            result = next(
                (x for x in organization_users if x.get("email") == email), {"id": "-"}
            ).get("id")

        return result

    def _check_user_access_to_this_prompt(self, prompt_labels):
        # Cased admin role users by default have access to all prompts
        role = self._get_user_role()
        if role == "admin":
            return True

        all_users_group_access = GroupAccess.find("_all")

        if all_users_group_access:
            is_label_match = check_labels_match(
                all_users_group_access.labels, prompt_labels
            )
            if is_label_match is True:
                return True

        organization_groups = self._get_organization_groups()
        user = self.get_current_user()

        user_access = UserAccess.case_insensitive_find(user.email)

        # If user access is defined, check labels associated with user match this prompt labels, or if user has wildcard access defined
        if user_access:
            # Client not using label selectors, wildcard for this user to have access to all when not admin role
            # "_all": true
            if hasattr(user_access, "_all") and user_access._all == True:
                return True

            # Client using label selectors
            is_label_match = check_labels_match(user_access.labels, prompt_labels)
            if is_label_match is True:
                return True

        # Check if any of the labels that associated with groups that user belongs to match this prompt labels, or if group has wildcard access defined
        if organization_groups:
            for group in organization_groups:
                group_user_emails = list(map(lambda user: user.email, group.users))
                if user.email.lower() in [email.lower() for email in group_user_emails]:
                    group_access = GroupAccess.case_insensitive_find(group.name)
                    if not group_access:
                        continue
                    else:
                        # Client not using label selectors, wildcard for this group to have access to all prompts
                        # e.g. "_all": true
                        if hasattr(group_access, "_all") and group_access._all == True:
                            return True
                        # Client using label selectors
                        is_label_match = check_labels_match(
                            group_access.labels, prompt_labels
                        )
                        if is_label_match is True:
                            return True
                        else:
                            continue

        # No access if user not admin, not from direct user access or not from indirect group access
        return False

    def get_v2_approval_programs_commands(self):
        approvals = []
        programs = Program.all()
        for program in programs:
            approval_settings = program.approval_settings
            if approval_settings.peer_approval == True:
                approvals.append(program.path)

        return approvals

    def _check_appproval_required(self, command):
        approval_required_commands = self.get_v2_approval_programs_commands()
        should_match = re.match(
            "(^" + (")|(^").join(approval_required_commands) + ")", command
        )

        match = bool(should_match)
        return match

    def get_human_location(self, ip):
        location = "Unknown location"
        try:
            g = geocoder.ip(ip)
        except ConnectionError:
            return location

        if g.ok == False:
            return location

        location = "{}, {}".format(g.city, g.state)
        return location

    # return camel cased api response, default state not include associated record, pass nested=True to include associated records
    def write_api(self, chunk, nested=False, api=True):
        if self._finished:
            raise RuntimeError("Cannot write() after finish()")
        if not isinstance(chunk, (bytes, unicode_type, dict)):
            message = "write() only accepts bytes, unicode, and dict objects"
            if isinstance(chunk, list):
                message += (
                    ". Lists not accepted for security reasons; see "
                    + "http://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.write"  # noqa: E501
                )
            raise TypeError(message)
        if isinstance(chunk, dict):
            chunk = self.custom_json_encode(
                dict_to_camel(chunk), nested=nested, api=api
            )
            self.set_header("Content-Type", "application/json; charset=UTF-8")
        chunk = utf8(chunk)
        self._write_buffer.append(chunk)

    # return snake cased api response, include associated records
    def write(self, chunk, nested=True, api=False):
        if self._finished:
            raise RuntimeError("Cannot write() after finish()")
        if not isinstance(chunk, (bytes, unicode_type, dict)):
            message = "write() only accepts bytes, unicode, and dict objects"
            if isinstance(chunk, list):
                message += (
                    ". Lists not accepted for security reasons; see "
                    + "http://www.tornadoweb.org/en/stable/web.html#tornado.web.RequestHandler.write"  # noqa: E501
                )
            raise TypeError(message)
        if isinstance(chunk, dict):
            chunk = self.custom_json_encode(chunk, nested=nested, api=api)
            self.set_header("Content-Type", "application/json; charset=UTF-8")
        chunk = utf8(chunk)
        self._write_buffer.append(chunk)

    def custom_json_encode(self, value, nested=False, api=False):
        return json.dumps(value, nested=nested, api=api, cls=CasedEncoder).replace(
            "</", "<\\/"
        )


class CasedEncoder(json.JSONEncoder):
    def __init__(self, nested=True, api=False, **kwargs):
        super(CasedEncoder, self).__init__(**kwargs)
        self.nested = nested
        self.api = api

    def default(self, obj):
        if isinstance(obj, bytes):
            if obj:
                return obj.decode("utf-8")
        if isinstance(obj, Base):
            if obj:
                if not self.api:
                    return obj.to_dict(nested=self.nested)
                else:
                    return dict_to_camel(obj.to_dict(nested=self.nested))
        if isinstance(obj, datetime):
            if obj:
                return obj.replace(tzinfo=tzlocal()).isoformat()
        elif isinstance(obj, Iterable):
            return list(obj)

        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)
