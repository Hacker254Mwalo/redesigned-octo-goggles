import { describe, expect, it } from "vitest";
import { parseListingDraft } from "./marketplace-ai";

describe("bounded listing assistant contract", () => {
  it("accepts a complete structured draft for seller review", () => {
    expect(parseListingDraft(JSON.stringify({
      description: "A durable everyday backpack described only from the seller's stated facts.",
      checklist: ["Confirm the exact material.", "Use original product photos."],
      safetyNote: "Review every fact before publishing.",
    }))).toEqual({
      description: "A durable everyday backpack described only from the seller's stated facts.",
      checklist: ["Confirm the exact material.", "Use original product photos."],
      safetyNote: "Review every fact before publishing.",
    });
  });

  it("rejects incomplete or unreadable AI output instead of publishing it", () => {
    expect(() => parseListingDraft("not JSON")).toThrow(/listing assistant/i);
    expect(() => parseListingDraft(JSON.stringify({ description: "Only a description" }))).toThrow(/incomplete/i);
  });
});
