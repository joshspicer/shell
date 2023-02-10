from sqlalchemy import Column, Text, JSON

from shell.models.base import Base


class APIProvider(Base):
    __tablename__ = "api_provider"
    api_name = Column(Text, unique=True)
    base_url = Column(Text)
    data = Column(JSON)
    authentication_type = Column(Text)

    def get_provider_pw(self):
        pw_name = self.authentication_type
        pw = self.pw(name=pw_name)
        if not pw:
            pw = self.pw()

        return pw
