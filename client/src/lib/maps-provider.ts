export const optionalMapFallbackMessage = "Map view is temporarily unavailable.";

/**
 * Maps are intentionally opt-in: pickup cards remain the public source of
 * directions, address, landmark, and opening-hours data until an owner has
 * configured and verified a production Maps provider.
 */
export function isOptionalMapsProviderEnabled(value?: string) {
  return value === "true";
}
