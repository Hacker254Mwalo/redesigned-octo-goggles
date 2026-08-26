import { describe, expect, it } from "vitest";
import { parseItemRequestDraft, parseListingDraft } from "./marketplace-ai";

describe("bounded marketplace AI contracts", () => {
  it("accepts a complete structured listing draft for seller review", () => {
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

  it("accepts an editable item-request draft without treating it as a submitted request", () => {
    expect(parseItemRequestDraft(JSON.stringify({
      title: "Durable school backpack",
      details: "Looking for a durable backpack for a primary-school learner. Preferred colour is blue.",
      checklist: ["Confirm the preferred size.", "Confirm the budget range."],
      safetyNote: "MtaaMarket confirms availability, price, and fulfilment manually.",
    }))).toEqual(expect.objectContaining({ title: "Durable school backpack" }));
  });

  it("rejects incomplete or unreadable AI output instead of publishing or submitting it", () => {
    expect(() => parseListingDraft("not JSON")).toThrow(/listing assistant/i);
    expect(() => parseListingDraft(JSON.stringify({ description: "Only a description" }))).toThrow(/incomplete/i);
    expect(() => parseItemRequestDraft(JSON.stringify({ title: "Only a title" }))).toThrow(/incomplete/i);
  });
});
