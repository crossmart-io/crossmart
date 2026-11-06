<?php

declare(strict_types=1);

namespace Crossmart\Serialization;

/**
 * Marks an optional, nullable field that is absent, as opposed to `null`.
 *
 * Some requests tell the two apart: in a listing override patch, an absent field keeps its
 * override and `null` reverts it to the product's value. Leave the argument out to send nothing.
 */
enum Undefined
{
    case Value;
}
