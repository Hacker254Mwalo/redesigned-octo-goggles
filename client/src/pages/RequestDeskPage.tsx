import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, HandHeart, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

export default function RequestDeskPage() {
  const { session } = useSupabaseAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState(() => new URLSearchParams(window.location.search).get("item")?.slice(0, 180) || "");
  const [details, setDetails] = useState("");
  const [budgetHint, setBudgetHint] = useState("");
  const [preferredFulfilment, setPreferredFulfilment] = useState<"siaya_pickup" | "home_delivery" | "collection_point" | "special_order">("siaya_pickup");
  const [preferredLocation, setPreferredLocation] = useState("");
  const request = trpc.marketplace.createV3ItemRequest.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTitle(""); setDetails(""); setBudgetHint(""); setPreferredFulfilment("siaya_pickup"); setPreferredLocation("");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!session) return setAccountOpen(true);
    request.mutate({ title, details, budgetHint: budgetHint ? Number(budgetHint) : undefined, preferredFulfilment, preferredLocation: preferredLocation || undefined });
  };

  return <MarketplaceLayout><div className="request-page"><section className="request-hero"><div><p className="eyebrow">MtaaMarket Request Desk</p><h1>Cannot find it?<br /><em>Ask us for it.</em></h1><p>Describe the physical product you need. MtaaMarket will review the request, confirm what is genuinely available, and update you before asking for payment or a fulfilment decision.</p></div><div className="request-hero-card"><HandHeart /><span>ASSISTED MARKET</span><strong>One request.<br />A clearer next step.</strong></div></section><div className="request-grid">{submitted ? <section className="request-form" aria-live="polite"><div className="request-form-heading"><div><p className="eyebrow">Request received</p><h2>Thank you. MtaaMarket will review it.</h2></div><CheckCircle2 aria-hidden="true" /></div><p className="mt-3 text-sm text-muted-foreground">Your request is recorded for private MtaaMarket review. It is not an order, a supplier search, a stock confirmation, a price quote, or a delivery promise.</p><div className="mt-6 flex flex-wrap gap-3"><button className="primary-cta" type="button" onClick={() => setSubmitted(false)}>Send another request <ArrowRight size={17} /></button><Link className="secondary-cta" href="/">Return to market</Link></div></section> : <form className="request-form" onSubmit={submit}><div className="request-form-heading"><div><p className="eyebrow">Tell us what you need</p><h2>Start an item request</h2></div><Sparkles /></div><label>What item are you looking for?<input required minLength={4} maxLength={180} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. A durable school backpack" /></label><label>Describe the item in simple words<textarea required minLength={10} maxLength={3000} value={details} onChange={event => setDetails(event.target.value)} placeholder="Mention size, colour, preferred brand, condition, quantity, or anything important." /><div className="mt-3 rounded-xl border border-[#d7e6dc] bg-[#f4faf5] p-3 text-sm leading-6 text-[#35584a]"><Sparkles className="mr-1 inline-block text-[#1b6a55]" size={15} /><strong>Before you send:</strong> include the item type, size or quantity, preferred condition, and anything that must be included. MtaaMarket will review every request manually.</div><small>This request does not check supply, set a price, or promise collection or delivery.</small></label><div className="request-form-grid"><label>Budget hint (optional)<input type="number" min="1" max="10000000" value={budgetHint} onChange={event => setBudgetHint(event.target.value)} placeholder="KES" /></label><label>Preferred fulfilment<select value={preferredFulfilment} onChange={event => setPreferredFulfilment(event.target.value as typeof preferredFulfilment)}><option value="siaya_pickup">Pickup in Siaya</option><option value="home_delivery">Home delivery preference</option><option value="collection_point">Known collection-point preference</option><option value="special_order">Let MtaaMarket advise</option></select></label></div><label><MapPin size={15} /> Broad location or collection suggestion<input value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} maxLength={180} placeholder="e.g. Siaya Town, Bondo, or a known collection point" /><small>Use a broad area only. Do not add a house number, ID number, payment detail, or live location.</small></label>{request.isError && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{request.error.message}</p>}<button className="primary-cta" disabled={request.isPending}>{request.isPending ? "Sending request…" : session ? "Send request to MtaaMarket" : "Sign in to send request"}<ArrowRight size={17} /></button></form>}<aside className="assisted-panel"><div><ShieldCheck /><p className="eyebrow">How the Request Desk works</p><h2>You remain in control.</h2></div><ol><li><span>01</span><p><strong>You describe the item.</strong> Keep it simple; MtaaMarket will ask only what is necessary.</p></li><li><span>02</span><p><strong>MtaaMarket checks a real route.</strong> We do not promise stock, price, collection, or delivery before confirmation.</p></li><li><span>03</span><p><strong>You receive the next instruction.</strong> A protected owner-confirmation workflow will explain availability, the actual hand-off route, and payment timing before you act.</p></li></ol><p className="assisted-note">This is a platform-managed request. MtaaMarket does not claim affiliation with an external supplier or collection provider unless a real agreement exists.</p></aside></div></div><MtaaAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} /></MarketplaceLayout>;
}
