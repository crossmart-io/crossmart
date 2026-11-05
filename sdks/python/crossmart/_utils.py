"""Small conversions between the facade's Pythonic arguments and the generated client's types."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Protocol, Self, TypeVar
from uuid import UUID

from ._generated.types import UNSET, Unset

Id = str | UUID
"""An id of a Crossmart resource, as a string or a :class:`uuid.UUID`."""

T = TypeVar("T")


class GeneratedModel(Protocol):
    """What every generated request model offers: building it from the API's JSON shape."""

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self: ...


ModelT = TypeVar("ModelT", bound=GeneratedModel)


def as_uuid(value: Id) -> UUID:
    """The id as a :class:`~uuid.UUID`. Raises :class:`ValueError` for a malformed id."""
    return value if isinstance(value, UUID) else UUID(value)


def as_str(value: Id) -> str:
    return str(value)


def optional_uuid(value: Id | None) -> UUID | Unset:
    return UNSET if value is None else as_uuid(value)


def or_unset(value: T | None) -> T | Unset:
    """``None`` means "not given" in the facade, which the generated client spells ``UNSET``."""
    return UNSET if value is None else value


def as_model(model: type[ModelT], value: ModelT | Mapping[str, Any]) -> ModelT:
    """Accepts a generated model, or a mapping in the API's JSON shape (camelCase keys)."""
    if isinstance(value, Mapping):
        return model.from_dict(value)
    return value
