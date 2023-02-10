import tornado
import sqlalchemy

from shell.controllers.v2 import BaseMixin
from shell.models import APIProvider
from shell.models.base import Base
from shell.utils import json_decode


def routes(**kwargs):
    return [
        (
            r"/api/api_providers",
            APIProvidersController,
            kwargs,
        ),
        (
            r"/api/api_providers/(\d+)",
            APIProviderController,
            kwargs,
        ),
    ]


class APIProviderController(BaseMixin, tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop):
        super(APIProviderController, self).initialize(loop)

    @tornado.web.authenticated
    def get(self, id):
        try:
            ap = APIProvider.find_or_fail(id)
            pw = ap.get_provider_pw()
        except Exception as e:
            raise tornado.web.HTTPError(404, str(e))

        self.write({"api_provider": ap, "pw": bool(pw)})

    @tornado.web.authenticated
    def delete(self, id):
        try:
            ap = APIProvider.find_or_fail(id)
        except Exception as e:
            raise tornado.web.HTTPError(404, str(e))

        try:
            ap.delete_pw()
            ap.delete()
        except Exception as e:
            Base.session.rollback()
            self.set_status(422)
            self.write({"status": 422, "reason": str(e)})
            return

        self.set_status(204)
        self.finish()

    @tornado.web.authenticated
    def patch(self, id):
        params = json_decode(self.request.body)

        try:
            ap = APIProvider.find_or_fail(id)
        except Exception as e:
            raise tornado.web.HTTPError(404, str(e))

        try:
            ap_data = ap.data.copy()
            password = params.get("password", None)
            secret_token = params.get("secret_token", None)

            if params.get("authentication_type", ap.authentication_type) == "basic":
                if params.get("username", None):
                    ap_data.update(
                        username=params["username"],
                    )
                if ap_data.get("auth_token", None):
                    ap_data.pop("auth_token")
                    ap.delete_pw()

                if password or password == "":
                    ap.store_pw(password, name="basic")

            elif params.get("authentication_type", ap.authentication_type) == "token":
                if params.get("auth_token", None):
                    ap_data.update(auth_token=params["auth_token"])
                if ap_data.get("username", None):
                    ap_data.pop("username")
                    ap.delete_pw()

                if secret_token or secret_token == "":
                    ap.store_pw(secret_token, name="token")

            ap.update(
                api_name=params.get("api_name", ap.api_name),
                base_url=params.get("base_url", ap.base_url),
                authentication_type=params.get(
                    "authentication_type", ap.authentication_type
                ),
                data=ap_data,
            )

            pw = ap.get_provider_pw()

            self.write({"api_provider": ap, "pw": bool(pw)})
            return

        except sqlalchemy.exc.IntegrityError as e:
            err = "Unable to update api provider, name already exists."

        except Exception as e:
            err = str(e)

        Base.session.rollback()

        self.set_status(422)
        self.write({"status": 422, "reason": err})
        return


class APIProvidersController(BaseMixin, tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop):
        super(APIProvidersController, self).initialize(loop)

    @tornado.web.authenticated
    def get(self):
        models = APIProvider.all()
        self.write({"api_providers": models})

    @tornado.web.authenticated
    def post(self):
        data = dict()
        params = json_decode(self.request.body)

        authentication_type = params.get("authentication_type")

        if authentication_type == "basic" and params.get("username", None):
            data.update(username=params.get("username"))
        elif authentication_type == "token" and params.get("auth_token", None):
            data.update(auth_token=params.get("auth_token"))

        try:
            api_provider = APIProvider.create(
                api_name=params.get("api_name"),
                base_url=params.get("base_url"),
                authentication_type=params.get("authentication_type"),
                data=data,
            )

            password = params.get("password", None)
            secret_token = params.get("secret_token", None)

            if (password or password == "") and authentication_type == "basic":
                api_provider.store_pw(password, name="basic")
            elif (
                secret_token or secret_token == ""
            ) and authentication_type == "token":
                api_provider.store_pw(secret_token, name="token")

            pw = api_provider.get_provider_pw()

            self.set_status(201)
            self.write({"api_provider": api_provider, "pw": bool(pw)})
            return

        except sqlalchemy.exc.IntegrityError as e:
            err = "Unable to create api provider, name already exists."

        except Exception as e:
            err = str(e)

        Base.session.rollback()

        self.set_status(422)
        self.write({"status": 422, "reason": err})
        return
