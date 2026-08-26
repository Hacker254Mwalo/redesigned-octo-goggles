import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { trpc } from "@/lib/trpc";
import { ArrowRight, HandHeart, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function RequestDeskPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [budgetHint, setBudgetHint] = useState("");
  const [preferredFulfilment, setPreferredFulfilment] = useState<"siaya_pickup" | "home_delivery" | "collection_point" | "special_order">("siaya_pickup");
  const [preferredLocation, setPreferredLocation] = useState("");
  const request = trpc.marketplace.createItemRequest.useMutation({
    onSuccess: () => { toast.success("Your request is with MtaaMarket. We will update you in your workspace."); setLocation("/dashboard"); },
    onError: error => toast.error(error.message),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) return startLogin();
    request.mutate({ title, details, budgetHint: budgetHint ? Number(budgetHint) : undefined, preferredFulfilment, preferredLocation: preferredLocation || undefined });
  };

  return <MarketplaceLayout><div className="request-page"><section className="request-hero"><div><p className="eyebrow">MtaaMarket Request Desk</p><h1>Cannot find it?<br /><em>Ask us for it.</em></h1><p>Describe the physical product you need. MtaaMarket will review the request, confirm what is genuinely available, and update you before asking for payment or a fulfilment decision.</p></div><div className="request-hero-card"><HandHeart /><span>ASSISTED MARKET</span><strong>One request.<br />A clearer next step.</strong></div></section><div className="request-grid"><form className="request-form" onSubmit={submit}><div className="request-form-heading"><div><p className="eyebrow">Tell us what you need</p><h2>Start an item request</h2></div><Sparkles /></div><label>What item are you looking for?<input required minLength={4} maxLength={180} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. A durable school backpack" /></label><label>Describe the item in simple words<textarea required minLength={10} maxLength={3000} value={details} onChange={event => setDetails(event.target.value)} placeholder="Mention size, colour, preferred brand, condition, quantity, or anything important." /></label><div className="request-form-grid"><label>Budget hint (optional)<input type="number" min="1" value={budgetHint} onChange={event => setBudgetHint(event.target.value)} placeholder="KES" /></label><label>Preferred fulfilment<select value={preferredFulfilment} onChange={event => setPreferredFulfilment(event.target.value as typeof preferredFulfilment)}><option value="siaya_pickup">Pickup in Siaya</option><option value="home_delivery">Home delivery in Siaya</option><option value="collection_point">Third-party collection point</option><option value="special_order">Let MtaaMarket advise</option></select></label></div><label><MapPin size={15} /> Preferred location or collection suggestion<input value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} maxLength={180} placeholder="e.g. Siaya Town, Bondo, or a known collection point" /></label><button className="primary-cta" disabled={request.isPending}>{request.isPending ? "Sending request…" : isAuthenticated ? "Send request to MtaaMarket" : "Sign in to send request"}<ArrowRight size={17} /></button></form><aside className="assisted-panel"><div><ShieldCheck /><p className="eyebrow">How the Request Desk works</p><h2>You remain in control.</h2></div><ol><li><span>01</span><p><strong>You describe the item.</strong> Keep it simple; MtaaMarket will ask only what is necessary.</p></li><li><span>02</span><p><strong>MtaaMarket checks a real route.</strong> We do not promise stock, price, or delivery before confirmation.</p></li><li><span>03</span><p><strong>You receive the next instruction.</strong> Availability, fulfilment, and payment timing are explained in your private workspace.</p></li></ol><p className="assisted-note">This is a platform-managed request. MtaaMarket does not claim affiliation with an external supplier or collection provider unless a real agreement exists.</p></aside></div></div></MarketplaceLayout>;
}
