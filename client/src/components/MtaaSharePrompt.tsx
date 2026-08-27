import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

const shareTitle = "Siaya Online MtaaMarket";
const shareText = "A local market for physical products and owner-managed item requests serving Siaya buyers.";

export function MtaaSharePrompt() {
  const [status, setStatus] = useState("");

  const shareMarket = async () => {
    const url = window.location.origin;
    const payload = { title: shareTitle, text: shareText, url };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        setStatus("Thank you for sharing MtaaMarket.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard?.writeText(url);
      setStatus("MtaaMarket link copied. You can share it where it is useful.");
    } catch {
      setStatus("Copy the website address from your browser to share MtaaMarket.");
    }
  };

  return <section className="mx-auto mb-16 max-w-6xl px-6 md:px-10" aria-labelledby="share-market-heading">
    <div className="grid gap-6 rounded-[2rem] border border-[#d6e5db] bg-[#edf5ef] p-7 shadow-[0_18px_46px_rgba(16,54,44,0.08)] md:grid-cols-[1fr_auto] md:items-center md:p-10">
      <div className="max-w-2xl">
        <p className="eyebrow">A local market grows by trust</p>
        <h2 id="share-market-heading" className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#123b30] md:text-4xl">Share the market, not your details.</h2>
        <p className="mt-3 text-sm leading-6 text-[#456259] md:text-base">If MtaaMarket could help someone find a physical product or send a managed item request, share the public link with them. We do not add tracking or send a message on your behalf.</p>
      </div>
      <div className="flex flex-col items-start gap-3 md:items-end">
        <button type="button" className="primary-cta" onClick={shareMarket}><Share2 size={17} />Share MtaaMarket</button>
        <p className="min-h-5 text-sm text-[#456259]" role="status" aria-live="polite">{status ? <><Check className="mr-1 inline-block" size={15} />{status}</> : <><Copy className="mr-1 inline-block" size={15} />Uses your device’s share menu or copies the link.</>}</p>
      </div>
    </div>
  </section>;
}
