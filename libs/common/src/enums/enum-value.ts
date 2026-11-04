/** A string enum object, such as `ListingStatus`. */
export type StringEnum<TValue extends string> = Readonly<Record<string, TValue>>;

/** The enum member equal to `value`, or undefined. Reads enum values stored as text. */
export function findEnumValue<TValue extends string>(
  enumObject: StringEnum<TValue>,
  value: string | null | undefined,
): TValue | undefined {
  return Object.values(enumObject).find((member) => member === value);
}

/** Like `findEnumValue`, for stored values that must be known: an unknown one is a bug. */
export function requireEnumValue<TValue extends string>(
  enumObject: StringEnum<TValue>,
  value: string,
): TValue {
  const member = findEnumValue(enumObject, value);
  if (member === undefined) {
    throw new Error(`Unknown enum value "${value}"`);
  }
  return member;
}
