import { Check, Share2 } from "lucide-react";
import { useState } from "react";

const shareTitle = "Siaya Mtaa Market";
const shareText = "Shop local in Siaya.";

export function MtaaSharePrompt() {
  const [status, setStatus] = useState("");

  const shareMarket = async () => {
    const url = window.location.origin;
    const payload = { title: shareTitle, text: shareText, url };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        setStatus("Thanks for sharing Siaya Mtaa Market.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard?.writeText(url);
      setStatus("Market link copied.");
    } catch {
      setStatus("Copy the website address to share the market.");
    }
  };

  return <section className="home-share" aria-labelledby="share-market-heading">
    <div><span className="home-share-icon"><Share2 size={18} /></span><div><h2 id="share-market-heading">Know someone in Siaya?</h2><p>Only the public market link is shared.</p></div></div>
    <div className="home-share-action"><button type="button" className="home-share-button" onClick={shareMarket}><Share2 size={15} />Share the market</button><p role="status" aria-live="polite">{status ? <><Check size={14} />{status}</> : null}</p></div>
  </section>;
}
