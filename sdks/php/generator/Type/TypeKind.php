<?php

declare(strict_types=1);

namespace Crossmart\Generator\Type;

enum TypeKind
{
    case String;
    case Number;
    case Integer;
    case Boolean;
    case DateTime;
    case Enum;
    case Model;
    case List;
    case FreeForm;
}
