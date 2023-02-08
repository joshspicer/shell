import os
import logging
import time
import urllib.parse

import json
import jwt
import pkce
import secrets
import tornado
import tornado.auth
import tornado.httpclient
from tornado.httputil import url_concat

from shell.controllers.v2 import BaseMixin
from shell.models.user import User


## In-memory store of PKCE code_verifier and code_challenge
VALIDATIONS = {}


# Don't try to use tornado.auth.*. We should make our own that supports PKCE.
# https://github.com/tornadoweb/tornado/issues/3207#issuecomment-1345669544
class AuthController(BaseMixin, tornado.web.RequestHandler, tornado.auth.OAuth2Mixin):

    OAUTH_AUTHORIZE_URL = "https://{}/idp/auth".format(
        os.getenv("CASED_SHELL_HOSTNAME", "example.com")
    )
    OAUTH_CLIENT_ID = os.getenv("CASED_SHELL_OAUTH_CLIENT_ID", "cased-shell")
    OAUTH_CLIENT_SECRET = os.getenv(
        "CASED_SHELL_OAUTH_CLIENT_SECRET", "cased-shell-secret"
    )

    def get(self):
        """
        Implement the OAuth2 PKCE flow.
        """

        # generate a "state" that be can use to track the tokens and codes.
        state = secrets.token_urlsafe(8)

        code_verifier, code_challenge = pkce.generate_pkce_pair()
        code_challenge_method = "S256"

        VALIDATIONS[state] = {
            "code_challenge": code_challenge,
            "code_verifier": code_verifier,
        }

        # Redirects to the AuthCallbackController to exchange the returned code
        # for an access token, which is validated and the interpolated into our
        # own cookie.
        redirect_uri = "https://" + self._get_hostname() + "/v2/auth/callback"

        # https://dexidp.io/docs/custom-scopes-claims-clients/#scopes
        scopes = ["openid", "email", "profile", "groups", "federated:id"]

        return self.redirect(
            url_concat(
                self.__class__.OAUTH_AUTHORIZE_URL,
                dict(
                    client_id=self.__class__.OAUTH_CLIENT_ID,
                    client_secret=self.__class__.OAUTH_CLIENT_SECRET,
                    state=state,
                    code_challenge=code_challenge,
                    code_challenge_method=code_challenge_method,
                    redirect_uri=redirect_uri,
                    response_type="code",
                    scope=" ".join(scopes),
                ),
            )
        )


class AuthCallbackController(BaseMixin, tornado.web.RequestHandler):
    async def get(self):
        """
        Exchange the authorization code for an access token and id token.
        Automatically create users and groups as needed based on the id token.

        Create a new token and store it as a cookie.

        This cookie is currently used to authenticate the user in the shell by both new and existing frontends.
        In the future the frontend should request and use refresh tokens instead.
        """

        state = self.get_argument("state")
        if not state or state not in VALIDATIONS:
            self.redirect("/")
            return

        try:
            token_exchange_response = await tornado.httpclient.AsyncHTTPClient().fetch(
                self.__class__.OPENID_TOKEN_ENDPOINT,
                method="POST",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                },
                body=urllib.parse.urlencode(
                    {
                        "redirect_uri": self.__class__.REDIRECT_URL,
                        "client_id": self.__class__.OAUTH_CLIENT_ID,
                        "client_secret": self.__class__.OAUTH_CLIENT_SECRET,
                        "code": self.get_argument("code"),
                        "code_verifier": VALIDATIONS[state]["code_verifier"],
                        "grant_type": "authorization_code",
                    }
                ),
            )

            token_exchange_response_body_dict = json.loads(token_exchange_response.body)

            id_token = token_exchange_response_body_dict["id_token"]

            # https://openid.net/specs/openid-connect-core-1_0.html#IDToken
            # https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
            claims = self._validate_oidc_token(id_token)
            logging.info("payload: %s", claims)

            user = User.find_create_or_update_from_id_token(claims)

            # login
            current_time = int(time.time())
            payload = {
                "user_id": user.id,
                "user": user.name,
                "email": user.email,
                "role": user.role,
                "provider": "sso",
                "iss": os.getenv("CASED_SHELL_HOSTNAME", ""),
                "iat": current_time,
                "exp": current_time + 86400,  # seconds in a day
            }

            cased_secret = os.getenv("JWT_SIGNING_KEY", "insecure")
            token = jwt.encode(payload, cased_secret, algorithm="HS256")

            # set the token
            # TODO refreshToken too
            if not self.set_token(token):
                return

            self.redirect("/")

            return

        except tornado.httpclient.HTTPClientError as error:
            logging.error(error.response)
            logging.error(error.response.headers)
            logging.error(error.response.body)
