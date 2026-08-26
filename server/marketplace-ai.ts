import { invokeLLM, listLLMModels } from "./_core/llm";

const requestTimes = new Map<number, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 6;

export type ListingDraft = {
  description: string;
  checklist: string[];
  safetyNote: string;
};

function enforceRateLimit(profileId: number) {
  const now = Date.now();
  const recent = (requestTimes.get(profileId) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) throw new Error("Listing assistant limit reached. Try again in about an hour.");
  requestTimes.set(profileId, [...recent, now]);
}

export function parseListingDraft(content: string | unknown): ListingDraft {
  if (typeof content !== "string") throw new Error("Listing assistant did not return readable text.");
  let parsed: ListingDraft;
  try {
    parsed = JSON.parse(content) as ListingDraft;
  } catch {
    throw new Error("Listing assistant returned unreadable output.");
  }
  if (!parsed.description || !Array.isArray(parsed.checklist) || !parsed.safetyNote) throw new Error("Listing assistant returned an incomplete draft.");
  return parsed;
}

/**
 * The assistant writes only a draft from seller-provided facts. It cannot approve
 * sellers, decide prices, guarantee stock, or receive buyer/order information.
 */
export async function createListingDraft(profileId: number, input: { title: string; categoryName: string; itemCondition: "new" | "used" | "refurbished"; facts?: string }) {
  enforceRateLimit(profileId);
  const catalog = await listLLMModels();
  const model = catalog.data.find(item => item.id === "gpt-5-mini")?.id || catalog.data.find(item => item.id === "gpt-5-nano")?.id;
  if (!model) throw new Error("Listing assistant is not available at the moment.");
  const response = await invokeLLM({
    model,
    maxTokens: 420,
    messages: [
      { role: "system", content: "You help a Kenyan marketplace seller produce an original product-description draft. Use only stated facts. Never invent brands, certificates, warranties, delivery terms, price, stock, condition details, or affiliation. Do not include phone numbers, payment instructions, links, or personal data. This is drafting support only, not a publishing or moderation decision." },
      { role: "user", content: `Create a clear, factual English listing draft for a physical product.\nTitle: ${input.title}\nCategory: ${input.categoryName}\nCondition: ${input.itemCondition}\nSeller facts: ${input.facts?.trim() || "No extra facts supplied."}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "listing_draft",
        strict: true,
        schema: {
          type: "object",
          properties: {
            description: { type: "string", description: "An original description under 500 characters that never claims unstated facts." },
            checklist: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4, description: "Missing facts the seller should check before publishing." },
            safetyNote: { type: "string", description: "A short reminder to use original photos and verify the listing details." },
          },
          required: ["description", "checklist", "safetyNote"],
          additionalProperties: false,
        },
      },
    },
  });
  return parseListingDraft(response.choices[0]?.message.content);
}
