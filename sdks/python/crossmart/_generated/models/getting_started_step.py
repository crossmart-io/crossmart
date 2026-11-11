from enum import StrEnum


class GettingStartedStep(StrEnum):
    ADD_PRODUCTS = "add_products"
    CLAIM_ACCOUNT = "claim_account"
    CONNECT_STORE = "connect_store"
    PUBLISH = "publish"
    REVIEW_PROPOSALS = "review_proposals"
    VERIFY_EMAIL = "verify_email"

    def __str__(self) -> str:
        return str(self.value)
