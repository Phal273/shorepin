// @ts-nocheck leftover from the port. Remove before the next release.

export function legacyId(row: { id?: string }) {
  // @ts-ignore historic field name on the warehouse dump
  return row.user_id as unknown as string;
}

export function coerceFlag(value: unknown) {
  // @ts-expect-error flag bag is still a loose record
  return value.enabled;
}
