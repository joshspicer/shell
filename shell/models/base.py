import re
import os
import hvac
from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.orm import declared_attr, Session
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_mixins import AllFeaturesMixin, TimestampsMixin, SerializeMixin

from shell.engine import engine


class BaseMixin(AllFeaturesMixin, SerializeMixin):
    __abstract__ = True

    @declared_attr
    def __tablename__(cls):
        return re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime, server_default=func.now(), default=func.now(), onupdate=func.now()
    )

    # returns a list of result; if no matching result, returns []
    @classmethod
    def find_by(cls, **kwargs):
        return cls.where(**kwargs).all()

    vault = hvac.Client(
        url=os.getenv("VAULT_URL", "http://localhost:8200"),
        token=os.getenv("VAULT_TOKEN", "dev"),
    )

    def vault_path(self):
        return "{}/{}".format(self.__class__.__tablename__, self.id)

    def store_pw(self, password, **kwargs):
        name = kwargs.get("name", "password")
        data = dict()
        data[name] = password
        self.__class__.vault.secrets.kv.v2.create_or_update_secret(
            path=self.vault_path(),
            secret=data,
        )

    def pw(self, **kwargs):
        name = kwargs.get("name", "password")
        try:
            pw = self.__class__.vault.secrets.kv.v2.read_secret_version(
                path=self.vault_path(),
            )["data"]["data"][name]
        except hvac.exceptions.InvalidPath:
            pw = None

        except Exception as e:
            pw = None

        return pw

    def delete_pw(self, **kwargs):
        if self.pw(**kwargs):
            self.__class__.vault.secrets.kv.v2.delete_metadata_and_all_versions(
                path=self.vault_path(),
            )


session = Session(engine)
BaseMixin.set_session(session)

Base = declarative_base(cls=BaseMixin)
