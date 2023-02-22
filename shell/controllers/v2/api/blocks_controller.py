import tornado.web
import tornado.escape
from shell.controllers.v2 import BaseMixin
from shell.models import Block
from shell.utils import json_decode


def routes(**kwargs):
    return [
        (r"/api/blocks", Create, kwargs),
        (
            r"/api/blocks/(\d+)/destroy",
            Destroy,
            kwargs,
        ),
        (
            r"/api/blocks/(\d+)/update",
            Update,
            kwargs,
        ),
    ]


class Update(BaseMixin, tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop):
        super(Update, self).initialize(loop)

    @tornado.web.authenticated
    def patch(self, id):
        block_params = json_decode(self.request.body)["block"]
        block = Block.find(id)
        block = block.update(
            data=block_params["data"],
            name=block_params["name"],
            sort_order=block_params["sort_order"],
        )

        self.write({"block": block.to_dict(exclude=["created_at", "updated_at"])})


class Destroy(BaseMixin, tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop):
        super(Destroy, self).initialize(loop)

    @tornado.web.authenticated
    def delete(self, id):
        block = Block.find(id)
        block.delete()
        self.set_status(204)


class Create(BaseMixin, tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    def initialize(self, loop):
        super(Create, self).initialize(loop)

    @tornado.web.authenticated
    def post(self):
        block_params = json_decode(self.request.body)["block"]
        block = Block.create(
            block_type=block_params["block_type"],
            runbook_id=block_params["runbook_id"],
            data=block_params["data"],
            name=block_params["name"],
            sort_order=block_params.get("sort_order", 1),
        )

        self.write({"block": block.to_dict(exclude=["created_at", "updated_at"])})
