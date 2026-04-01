import { format, isValid, parse } from "date-fns";

/**
 * Turn stored custom-order field values into readable text for the seller dashboard.
 */
export function formatCustomOrderFieldValue(raw: string, fieldType: string): string {
  const v = raw?.trim() ?? "";
  if (!v) return "—";

  switch (fieldType) {
    case "boolean":
      return v === "true" ? "Yes" : v === "false" ? "No" : v;
    case "date": {
      const d = parse(v, "yyyy-MM-dd", new Date());
      return isValid(d) ? format(d, "MMMM d, yyyy") : v;
    }
    case "multiselect": {
      const parts = v.split(", ").map((s) => s.trim()).filter(Boolean);
      return parts.length ? parts.join(", ") : "—";
    }
    default:
      return v;
  }
}
