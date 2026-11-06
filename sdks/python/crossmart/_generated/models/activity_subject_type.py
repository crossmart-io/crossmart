from enum import StrEnum


class ActivitySubjectType(StrEnum):
    AGENT_CONNECTION = "agent_connection"
    API_KEY = "api_key"
    CHANNEL_CONNECTION = "channel_connection"
    CUSTOM_ROLE = "custom_role"
    IMPORT_JOB = "import_job"
    INVITATION = "invitation"
    MEMBER = "member"
    PRODUCT = "product"
    PRODUCT_VIEW = "product_view"
    WEBHOOK_ENDPOINT = "webhook_endpoint"
    WORKSPACE = "workspace"

    def __str__(self) -> str:
        return str(self.value)
