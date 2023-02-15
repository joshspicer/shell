import time
import datetime

from shell.cloudyblobject import (
    IDIndexedCloudyBlobject,
)


class ShellSession(IDIndexedCloudyBlobject):
    primary_key = "session_id"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.start_time = kwargs.get("start_time") or self._current_time()
        self.end_time = kwargs.get("end_time")

    @classmethod
    def active_sessions(cls, user=None):
        sessions = cls.list()
        active = []
        for session in sessions:
            if session.end_time == None:
                if user == None:
                    active.append(session)
                elif user == session.creator:
                    active.append(session)

        return sorted(active, key=lambda i: i.start_time, reverse=True)

    @classmethod
    def group_active_sessions(cls, group):
        sessions = cls.list()
        active = []
        group_users = group.users
        for session in sessions:
            if session.end_time == None:
                if session.creator in [u.email for u in group_users]:
                    active.append(session)

        return sorted(active, key=lambda i: i.start_time, reverse=True)

    @classmethod
    def group_past_sessions(cls, group):
        sessions = cls.list()
        inactive = []
        group_users = group.users
        for session in sessions:
            if session.end_time != None:
                if session.creator in [u.email for u in group_users]:
                    inactive.append(session)

            try:
                _ = session.recording_enabled
            except AttributeError:
                # for empty data, default to true
                session.recording_enabled = True

        return sorted(inactive, key=lambda i: i.start_time, reverse=True)

    @classmethod
    def past_sessions(cls, user=None):
        sessions = cls.list()
        inactive = []
        for session in sessions:
            if session.end_time != None:
                if user == None:
                    inactive.append(session)
                elif user == session.creator:
                    inactive.append(session)
            try:
                _ = session.recording_enabled
            except AttributeError:
                # for empty data, default to true
                session.recording_enabled = True

        return sorted(inactive, key=lambda i: i.start_time, reverse=True)

    @classmethod
    def sessions_count(cls, days_til_today):
        sessions = cls.list()
        count = 0
        for session in sessions:
            if session.start_time > datetime.datetime.timestamp(
                datetime.datetime.now() - datetime.timedelta(days=days_til_today)
            ):
                count = count + 1

        return count

    @classmethod
    def users_count(cls, days_til_today):
        sessions = cls.list()
        user_set = set()

        for session in sessions:
            if session.start_time > datetime.datetime.timestamp(
                datetime.datetime.now() - datetime.timedelta(days=days_til_today)
            ):
                user_set.add(session.creator)

        return len(user_set)

    @classmethod
    def sessions_date_list(cls, days_til_today):
        sessions = cls.list()
        sessions_date_list = []

        for session in sessions:
            if session.start_time > datetime.datetime.timestamp(
                datetime.datetime.now() - datetime.timedelta(days=days_til_today)
            ):
                sessions_date_list.append(session.start_time)

        return sessions_date_list

    def _current_time(self):
        return int(time.time())

    def end_session(self):
        self.end_time = self._current_time()
        self.save()

    def duration(self):
        if not self.start_time:
            return 0
        if not self.end_time:
            # session is ongoing, report its current duration
            current = self._current_time()
        else:
            current = self.end_time

        return current - self.start_time

    def __repr__(self):
        # pylint: disable=no-member
        return "<ShellSession (session_id: {} start_time: {} end_time: {} creator: {} location: {} ip: {} target_host: {} reason: {} recording_enabled: {})>".format(
            self.session_id,
            self.start_time,
            self.end_time,
            self.creator,
            self.location,
            self.ip,
            self.target_host,
            self.reason,
            self.recording_enabled,
        )
        # pylint: enable=no-member
