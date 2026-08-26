import { describe, expect, it } from "vitest";
import { isOptionalMapsProviderEnabled, optionalMapFallbackMessage } from "../client/src/lib/maps-provider";

describe("MtaaMarket optional pickup map", () => {
  it("keeps the external map provider off until an owner explicitly enables it", () => {
    expect(isOptionalMapsProviderEnabled()).toBe(false);
    expect(isOptionalMapsProviderEnabled("false")).toBe(false);
    expect(isOptionalMapsProviderEnabled("true")).toBe(true);
  });

  it("retains an accessible station-card fallback instead of treating maps as required", () => {
    expect(optionalMapFallbackMessage).toContain("temporarily unavailable");
  });
});
