# MtaaMarket AI Capability Audit — 27 August 2026

## Live model inventory

The project’s live server-side model inventory was retrieved on 27 August 2026 before assessing any new AI feature. The available IDs are `gpt-5-nano`, `gpt-5-mini`, `gpt-5`, `gpt-5.5`, `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-opus-4-7`, `gemini-3-flash-preview`, and `gemini-3.1-pro-preview`. The inventory also reports built-in web-search capability for these models. No model call was made and no customer, vendor, product, or supplier data was sent to an AI provider during this audit.

## Current boundary

MtaaMarket already describes AI as an editable drafting aid for seller listing copy, original-photo readiness, category completeness, and owner-reviewed support. The public Seller Studio correctly says that AI must not publish a listing, choose price, approve a seller, check supply, promise delivery, or send a customer message by itself. The public site currently has no open autonomous AI agent, automatic supplier tool, background scheduler, or third-party advertising script.

The previously implemented seller-draft mechanism remains behind the protected workspace boundary. Because the Supabase UUID profile and role migration is incomplete, it must not be exposed as a public vendor-write feature. The appropriate next stage is therefore a limited **buyer-facing explanation and request-quality helper** that can improve the text a person voluntarily types, but cannot select products, prices, suppliers, payments, delivery, roles, or customer actions.

## Selection principles

| Capability | Safe now | Later, after protected migration | Not permitted |
|---|---|---|---|
| Request clarity | Editable, user-triggered text suggestions with a clear manual-review notice. | Owner-reviewed request summaries stored with protected records. | Automatic submission, conversion to an order, or supplier contact. |
| Seller listing help | Public explanation of content and photo requirements. | User-triggered editable drafts after a verified seller role and media/RLS path exist. | AI publishing, approval, pricing, stock selection, or category moderation. |
| Jumia-assisted sourcing | Owner-authored public process explanation and a customer confirmation checklist. | Owner-only manual sourcing records after protected workflow migration. | Scraping, copied listings, real-time price claims without an authorised feed, affiliate claims, or automatic checkout. |
| Operations updates | Static launch checklist and owner-controlled review. | Deterministic scheduled health checks after a chosen trigger/frequency and secure delivery route are approved. | Unattended AI decisions, recurring customer messages, or polling supplier sites. |

## Next decision

The next capability decision must combine the Jumia research and current code audit. Until then, **no built-in model is invoked in the application**. This preserves the zero-cost public experience and prevents an AI provider from receiving personal data before the founder selects an explicit model, budget, input limits, retention/privacy position, and user-visible consent copy.
