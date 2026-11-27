/**
 * Airtable IDs end up in request paths (`/bases/${baseId}/webhooks/...`), and some of them arrive
 * from outside, e.g. the base and webhook IDs in a webhook ping. An ID like `../../meta/whoami` or
 * `app1?x=` would otherwise steer an authenticated request to another Airtable endpoint.
 *
 * Real IDs are a type prefix plus letters and digits (e.g. `appXXXXXXXXXXXXXX`). The check accepts
 * any length so demo IDs like `appEnterpriseShowcase01` keep working; what it rules out are the
 * characters that change a URL's meaning: `/`, `.`, `?`, `#`, `%`, whitespace.
 */
const PREFIX = {
  base: 'app',
  table: 'tbl',
  field: 'fld',
  webhook: 'ach',
} as const;

export type AirtableIdKind = keyof typeof PREFIX;

export function isAirtableId(kind: AirtableIdKind, value: unknown): value is string {
  return typeof value === 'string' && new RegExp(`^${PREFIX[kind]}[A-Za-z0-9]{1,64}$`).test(value);
}

export function assertAirtableId(kind: AirtableIdKind, value: unknown): string {
  if (!isAirtableId(kind, value)) {
    throw new Error(`Invalid Airtable ${kind} id: expected "${PREFIX[kind]}" followed by letters and digits`);
  }
  return value;
}

/** Validated and URL-encoded, ready to put in a path segment. */
export function idSegment(kind: AirtableIdKind, value: unknown): string {
  return encodeURIComponent(assertAirtableId(kind, value));
}
