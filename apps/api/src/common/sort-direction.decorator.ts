import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortDirection } from '@crossmart/common';
import { IsEnum, IsOptional } from 'class-validator';
import { SORT_DIRECTION_SCHEMA_NAME } from './api.constants.js';

/** The optional `direction` of a list query, documented with the list's default. */
export function SortDirectionProperty(defaultDirection: SortDirection): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      enum: SortDirection,
      enumName: SORT_DIRECTION_SCHEMA_NAME,
      default: defaultDirection,
    }),
    IsOptional(),
    IsEnum(SortDirection),
  );
}
