import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 5_000_000;

export default function VendorUpload() {
  const { configured, loading, session } = useSupabaseAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageType, setImageType] = useState<(typeof ACCEPTED_IMAGE_TYPES)[number] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [formError, setFormError] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const vendorAccess = trpc.marketplace.v3VendorAccess.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const applyForVendor = trpc.marketplace.applyForV3Vendor.useMutation({
    onSuccess: () => {
      setAgreementAccepted(false);
      vendorAccess.refetch();
      toast.success("Your agreement and vendor request are recorded for owner review.");
    },
    onError: error => toast.error(error.message),
  });

  const submit = trpc.marketplace.submitV3VendorProduct.useMutation({
    onSuccess: () => {
      setTitle("");
      setPrice("");
      setImageData("");
      setImageType(null);
      setSelectedFileName("");
      if (fileInput.current) fileInput.current.value = "";
      toast.success("Listing submitted for owner review.");
    },
    onError: error => {
      setFormError(error.message);
      toast.error(error.message);
    },
  });

  function chooseImage(file: File | undefined) {
    setFormError("");
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setImageData("");
      setImageType(null);
      return setFormError("Choose a JPEG, PNG, or WebP image.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageData("");
      setImageType(null);
      return setFormError("Choose an image smaller than 5 MB.");
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageData(String(reader.result));
      setImageType(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]);
      setSelectedFileName(file.name);
    };
    reader.onerror = () => setFormError("MtaaMarket could not read that image. Please choose another file.");
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!imageData || !imageType) return setFormError("Choose a supported product image before submitting.");
    submit.mutate({ title, price: Number(price), imageData, imageType });
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-xl px-5 py-14">
        <p className="eyebrow">Approved vendor workspace</p>
        <h1 className="mt-2 text-4xl font-semibold">Submit a product</h1>
        <p className="mt-3 text-muted-foreground">Every listing is owner-reviewed before it can appear publicly. Only original, physical products for Siaya buyers are accepted.</p>

        {!configured && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">Vendor access is being prepared</h2><p className="mt-2 text-sm text-muted-foreground">Email account access is not available in this environment yet. Please return after it has been configured.</p></section>}
        {configured && loading && <section className="mt-8 rounded-2xl border bg-white p-6" aria-live="polite"><h2 className="font-semibold">Checking your email session</h2><p className="mt-2 text-sm text-muted-foreground">Your Vendor Studio will open once the secure session check is complete.</p></section>}
        {configured && !loading && !session && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">Sign in before submitting</h2><p className="mt-2 text-sm text-muted-foreground">Use the Account menu in the header to sign in with your verified MtaaMarket email. After the owner approves your vendor profile and records your agreement, return here to submit a listing.</p></section>}

        {configured && !loading && session && vendorAccess.isLoading && <section className="mt-8 rounded-2xl border bg-white p-6" aria-live="polite"><h2 className="font-semibold">Checking your vendor access</h2><p className="mt-2 text-sm text-muted-foreground">We are confirming your agreement and owner approval before showing the secure submission form.</p></section>}
        {configured && !loading && session && vendorAccess.isError && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">Vendor access could not be checked</h2><p className="mt-2 text-sm text-muted-foreground">Refresh the page and try again. No listing has been created.</p></section>}
        {configured && !loading && session && vendorAccess.data && !vendorAccess.data.canSubmitListings && (
          <section className="mt-8 rounded-2xl border bg-white p-6">
            <h2 className="font-semibold">{vendorAccess.data.isVendor ? "Vendor approval is pending" : "Request vendor approval"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{vendorAccess.data.isVendor ? "Your agreement is recorded. The MtaaMarket owner must approve your vendor profile before you can submit a listing." : "Vendor access starts with an explicit agreement and an owner review. Your contact details remain platform-managed."}</p>
            {!vendorAccess.data.isVendor && <label className="mt-5 flex items-start gap-3 rounded-xl bg-muted p-4 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={agreementAccepted} onChange={event => setAgreementAccepted(event.target.checked)} /><span>I confirm I will provide original product information, use the platform-managed buyer communication process, and follow MtaaMarket’s physical-products rules for Siaya buyers.</span></label>}
            {!vendorAccess.data.isVendor && <button className="primary-cta mt-5" type="button" disabled={!agreementAccepted || applyForVendor.isPending} onClick={() => applyForVendor.mutate({ agreementAccepted: true })}>{applyForVendor.isPending ? "Sending request…" : "Accept agreement & request approval"}</button>}
          </section>
        )}

        {configured && !loading && session && vendorAccess.data?.canSubmitListings && (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <fieldset disabled={submit.isPending} className="space-y-5 disabled:cursor-not-allowed disabled:opacity-70">
              <label className="block text-sm font-medium">Product photo
                <input ref={fileInput} className="mt-2 block w-full rounded-lg border border-border bg-white p-2 text-sm" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => chooseImage(event.target.files?.[0])} />
                <span className="mt-2 block text-xs font-normal text-muted-foreground">JPEG, PNG, or WebP only. Up to 5 MB; maximum 6,000 pixels per side.</span>
              </label>
              {selectedFileName && <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground" aria-live="polite">Selected: {selectedFileName}</p>}
              <label className="block text-sm font-medium">Listing title
                <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={3} maxLength={180} value={title} onChange={event => setTitle(event.target.value)} autoComplete="off" />
              </label>
              <label className="block text-sm font-medium">Price (KES)
                <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" type="number" inputMode="decimal" min="1" max="10000000" step="1" required value={price} onChange={event => setPrice(event.target.value)} />
              </label>
              <p className="rounded-xl border border-[#d5e8de] bg-[#f1f8f4] p-4 text-sm text-[#275847]">Your profile, owner approval, and vendor agreement are checked securely when you submit. If approval is still pending, no listing is created.</p>
              {formError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{formError}</p>}
              <button className="primary-cta" type="submit" disabled={submit.isPending || !imageData || !imageType}>{submit.isPending ? "Submitting securely…" : "Submit for owner review"}</button>
            </fieldset>
          </form>
        )}
      </main>
    </MarketplaceLayout>
  );
}
