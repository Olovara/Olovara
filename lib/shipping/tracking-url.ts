/**
 * Build a carrier tracking URL from carrier + tracking number (sellers never paste URLs).
 */
export function getTrackingUrl(
  carrier: string,
  tracking: string,
): string | null {
  const t = tracking.trim();
  if (!t) return null;
  switch (carrier.trim().toLowerCase()) {
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(t)}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${encodeURIComponent(t)}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}`;
    case "dhl":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(t)}`;
    default:
      return null;
  }
}
