from enum import StrEnum


class ConnectFailure(StrEnum):
    ACCESS_DENIED = "access_denied"
    CHANNEL_UNAVAILABLE = "channel_unavailable"
    EXPIRED_STATE = "expired_state"
    INVALID_ACCOUNT = "invalid_account"
    INVALID_SIGNATURE = "invalid_signature"
    INVALID_STATE = "invalid_state"
    MISSING_SCOPES = "missing_scopes"
    NOT_PERMITTED = "not_permitted"
    PLAN_LIMIT_REACHED = "plan_limit_reached"
    SESSION_REQUIRED = "session_required"
    UNEXPECTED = "unexpected"

    def __str__(self) -> str:
        return str(self.value)
