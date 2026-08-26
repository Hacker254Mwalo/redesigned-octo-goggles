import { describe, expect, it } from "vitest";
import { requestDeskHref, searchEmptyHeading } from "../client/src/lib/marketplace-search";

describe("MtaaMarket discovery hand-off", () => {
  it("passes an unfound search term into the Request Desk safely", () => {
    expect(requestDeskHref("solar lantern")).toBe("/request?item=solar%20lantern");
    expect(requestDeskHref("   ")).toBe("/request");
  });

  it("does not misrepresent an empty search as an unavailable order", () => {
    expect(searchEmptyHeading("solar lantern")).toContain("No verified listing matches");
    expect(searchEmptyHeading("")).toContain("preparing");
  });
});
