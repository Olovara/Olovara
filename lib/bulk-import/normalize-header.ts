/**
 * Normalize CSV header strings so mapping and row lookups work consistently.
 * Use everywhere headers are read (parse, mapping API, processor) to avoid import errors
 * from BOM, trailing spaces, or inconsistent whitespace.
 */

const BOM = "\uFEFF";

/**
 * Normalize a single CSV header for consistent use as object key and in mapping.
 * - Removes BOM (byte order mark)
 * - Trims leading/trailing whitespace
 * - Collapses internal runs of spaces/tabs to a single space
 */
export function normalizeCsvHeader(header: string): string {
  if (typeof header !== "string") return "";
  return header
    .replace(BOM, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Normalize an array of CSV headers (e.g. from parse or from API).
 */
export function normalizeCsvHeaders(headers: string[]): string[] {
  if (!Array.isArray(headers)) return [];
  return headers.map((h) => normalizeCsvHeader(h)).filter((h) => h.length > 0);
}

/**
 * Get value from a row by header, using normalized header matching so that
 * "Handle ID", "handleId ", "  Handle ID  " all match the same column.
 */
export function getRowValueByHeader(
  row: Record<string, unknown>,
  header: string
): unknown {
  const normalized = normalizeCsvHeader(header);
  if (row[header] !== undefined) return row[header];
  const key = Object.keys(row).find((k) => normalizeCsvHeader(k) === normalized);
  return key !== undefined ? row[key] : undefined;
}
