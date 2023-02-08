import tornado.web

from shell.models import LogEntry, Group
from shell.controllers.v2 import BaseMixin
from shell.models.user import User


def routes(**kwargs):
    return [
        (r"/api/sessions", ActivitySessionsHandler, kwargs),
        (r"/api/sessions/users/(\d+)", UserActivitySessionsHandler, kwargs),
        (r"/api/sessions/groups/(\d+)", GroupActivitySessionsHandler, kwargs),
    ]


class ActivitySessionsHandler(BaseMixin, tornado.web.RequestHandler):
    def initialize(self, loop):
        super(ActivitySessionsHandler, self).initialize(loop)

    @tornado.web.authenticated
    def get(self):
        sessions = LogEntry.sort("-created_at").all()
        self.write({"data": {"sessions": sessions}})


class UserActivitySessionsHandler(BaseMixin, tornado.web.RequestHandler):
    def initialize(self, loop):
        super(UserActivitySessionsHandler, self).initialize(loop)

    @tornado.web.authenticated
    def get(self, user_id):
        user_data = User.find(user_id)
        user = {"id": user_data.id, "name": user_data.name, "email": user_data.email}
        sessions = LogEntry().user_sessions(user_id)
        self.write({"data": {"user": user, "sessions": sessions}})


class GroupActivitySessionsHandler(BaseMixin, tornado.web.RequestHandler):
    def initialize(self, loop):
        super(GroupActivitySessionsHandler, self).initialize(loop)

    @tornado.web.authenticated
    def get(self, group_id):
        # move this to the model level after migration
        group = Group.find(group_id)
        sessions = []

        if group:
            sessions = LogEntry().group_sessions(group)

        self.write({"data": {"sessions": sessions}})
