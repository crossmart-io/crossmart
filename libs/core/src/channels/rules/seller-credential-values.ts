import { BadRequestException } from '@nestjs/common';
import type { SellerCredentialField, SellerCredentialValues } from '@crossmart/connectors';
import {
  CREDENTIALS_FIELD_MISSING,
  CREDENTIALS_FIELD_NOT_ALLOWED,
  CREDENTIALS_FIELD_SEPARATOR,
  CREDENTIALS_FIELD_TOO_LONG,
  CREDENTIALS_FIELD_UNKNOWN,
} from '../channels.constants.js';

/** What is wrong with one field's value, or null; never the value itself, which may be a key. */
function fieldProblem(field: SellerCredentialField, value: string): string | null {
  if (value.length === 0) return CREDENTIALS_FIELD_MISSING;
  if (value.length > field.maxLength) return CREDENTIALS_FIELD_TOO_LONG;
  if (field.options && !field.options.includes(value)) return CREDENTIALS_FIELD_NOT_ALLOWED;
  return null;
}

function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * The merchant's values, trimmed, once every field the connector names has one it accepts and
 * nothing else was sent. Throws 400 naming the fields at fault, without their values.
 */
export function parseSellerCredentialValues(
  fields: readonly SellerCredentialField[],
  raw: Readonly<Record<string, unknown>>,
): SellerCredentialValues {
  const known = new Set(fields.map((field) => field.key));
  const problems = Object.keys(raw)
    .filter((key) => !known.has(key))
    .map((key) => `${key} ${CREDENTIALS_FIELD_UNKNOWN}`);
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = trimmed(raw[field.key]);
    const problem = fieldProblem(field, value);
    if (problem) problems.push(`${field.key} ${problem}`);
    values[field.key] = value;
  }
  if (problems.length > 0) {
    throw new BadRequestException(problems.join(CREDENTIALS_FIELD_SEPARATOR));
  }
  return values;
}
