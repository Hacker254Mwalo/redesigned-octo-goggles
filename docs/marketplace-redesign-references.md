# Marketplace redesign references

## Findings

The current official Kilimall Kenya storefront exposes categories near the top, then product-led promotion sections and named item cards with KSh prices; category and sale browsing appears before its longer company/help copy. Source: [Kilimall Kenya](https://www.kilimall.co.ke/).

Jiji Kenya's public homepage is more search-first and listing-led: the main visitor choices are a prominent search field, a location selector, a sell action and trending ads. Source: [Jiji Kenya](https://jiji.co.ke/).

The redesign applies the general interaction patterns (search first, categories immediately accessible, product cards before explainer copy, clear geography and product actions) without copying either site's brand, colors, copy, inventory or affiliation. Siaya Mtaa Market uses only its own seller listings and sanitized live search results; search results are not represented as verified local stock.

## Product-image reliability

Tavily’s current Search API documentation states that `include_images: true` can return images from the specific source page on each result, plus a separate query-related image list. Its March 2026 image-retrieval note emphasizes source-linked visuals and warns teams building e-commerce interfaces to evaluate attribution and usage rights. Sources: [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search) and [Tavily image retrieval](https://www.tavily.com/blog/better-image-retrieval).

For the live Siaya fridge query tested on 14 November 2026, sanitized results contained product text but no image URLs. A direct server-side fetch of a public product page returned HTTP 403, so the redesign does not substitute a picture of a different model. The UI uses a neutral product placeholder when the supplier page provides no usable image.
