from enum import StrEnum


class ListingDisplayState(StrEnum):
    DRAFT = "draft"
    FAILED = "failed"
    NEEDS_DETAILS = "needs_details"
    PUBLISHED = "published"
    PUBLISHING = "publishing"
    READY = "ready"
    REMOVED = "removed"
    REMOVING = "removing"

    def __str__(self) -> str:
        return str(self.value)
