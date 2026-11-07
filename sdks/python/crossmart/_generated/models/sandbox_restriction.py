from enum import StrEnum


class SandboxRestriction(StrEnum):
    ADD_PRODUCTS = "add_products"
    CONNECT_CHANNEL = "connect_channel"
    CREATE_WORKSPACE = "create_workspace"
    GENERATE_CONTENT = "generate_content"
    INVITE_MEMBER = "invite_member"
    PUBLISH = "publish"
    SUBSCRIBE = "subscribe"

    def __str__(self) -> str:
        return str(self.value)
