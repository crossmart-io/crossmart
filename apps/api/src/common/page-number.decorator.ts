import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

const FIRST_PAGE = 1;

/** The optional 1-based `page` of a list query, for tables; it wins over `cursor`. */
export function PageNumberProperty(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      minimum: FIRST_PAGE,
      description: '1-based page number, for tables with page numbers. It wins over `cursor`.',
    }),
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(FIRST_PAGE),
  );
}
