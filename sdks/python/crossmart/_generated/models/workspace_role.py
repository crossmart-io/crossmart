from enum import StrEnum


class WorkspaceRole(StrEnum):
    ADMIN = "ADMIN"
    APPROVER = "APPROVER"
    CUSTOM = "CUSTOM"
    EDITOR = "EDITOR"
    OWNER = "OWNER"
    VIEWER = "VIEWER"

    def __str__(self) -> str:
        return str(self.value)
