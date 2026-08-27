import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { getV3ListingCategory } from "@shared/v3-listing";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ModerationProduct = {
  id: string;
  title: string;
  category_slug: string;
  stock_quantity: number;
  image_url: string;
  vendor_id: string | null;
  final_price: string | number;
  status: "PENDING" | "ACTIVE" | "FLAGGED";
};

const statusText = {
  PENDING: "Awaiting review",
  ACTIVE: "Publicly visible",
  FLAGGED: "Hidden for review",
} as const;

export default function Admin() {
  const { configured, loading: sessionLoading, session } = useSupabaseAuth();
  const moderationQueue = trpc.marketplace.v3ModerationProducts.useQuery();
  const vendorApplications = trpc.marketplace.v3VendorApplications.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const [productToDelete, setProductToDelete] = useState<ModerationProduct | null>(null);
  const bootstrapOwner = trpc.marketplace.bootstrapV3Owner.useMutation({
    onSuccess: () => {
      toast.success("Founder owner access is activated.");
      moderationQueue.refetch();
      vendorApplications.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const updateVendorApproval = trpc.marketplace.updateV3VendorApproval.useMutation({
    onSuccess: result => {
      toast.success(result.isApproved ? "Vendor approved for listings." : "Vendor listing access suspended.");
      vendorApplications.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const moderate = trpc.marketplace.moderateV3Product.useMutation({
    onSuccess: () => {
      toast.success("Product moderation recorded.");
      moderationQueue.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.marketplace.deleteV3Product.useMutation({
    onSuccess: () => {
      setProductToDelete(null);
      toast.success("Product permanently removed.");
      moderationQueue.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const actionPending = moderate.isPending || remove.isPending;

  function updateProduct(productId: string, status: "ACTIVE" | "REJECTED" | "FLAGGED") {
    moderate.mutate({ productId, status });
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-5xl px-5 py-14">
        <p className="eyebrow">Owner operations</p>
        <h1 className="mt-2 text-4xl font-semibold">Product moderation</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Only the verified MtaaMarket owner role can review products. This queue includes listings awaiting review, publicly visible listings, and hidden flagged listings. Only active products appear in public discovery.</p>

        {moderationQueue.isError && <section className="mt-8 rounded-2xl border bg-white p-6"><ShieldCheck className="mb-3" aria-hidden="true" /><h2 className="font-semibold">Owner access required</h2><p className="mt-2 text-sm text-muted-foreground">Sign in with the verified founder email session to review listings. No product data is shown until the server confirms the owner role.</p>{configured && !sessionLoading && !session && <p className="mt-4 text-sm font-medium">Use the Account menu in the header to sign in first.</p>}{configured && !sessionLoading && session && <button className="primary-cta mt-5" disabled={bootstrapOwner.isPending} onClick={() => bootstrapOwner.mutate()}>{bootstrapOwner.isPending ? "Activating…" : "Founder: activate owner access"}</button>}</section>}
        {moderationQueue.isLoading && <section className="mt-8 rounded-2xl border bg-white p-6" aria-live="polite"><h2 className="font-semibold">Loading the moderation queue</h2><p className="mt-2 text-sm text-muted-foreground">Checking your owner access and current listing states.</p></section>}
        {!moderationQueue.isError && !moderationQueue.isLoading && moderationQueue.data?.length === 0 && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">No listings need review</h2><p className="mt-2 text-sm text-muted-foreground">New approved-vendor submissions will appear here as awaiting review.</p></section>}

        {!moderationQueue.isError && moderationQueue.data && moderationQueue.data.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {moderationQueue.data.map((product: ModerationProduct) => (
              <article className="rounded-2xl border bg-white p-5 shadow-sm" key={product.id}>
                <img className="h-44 w-full rounded-xl object-cover" src={product.image_url} alt={`${product.title} listing image`} />
                <div className="mt-4 flex items-start justify-between gap-3"><h2 className="font-semibold">{product.title}</h2><span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{statusText[product.status]}</span></div>
                <p className="mt-2 text-sm text-muted-foreground">Vendor: {product.vendor_id ? "Approved vendor listing" : "Owner listing"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Category: {getV3ListingCategory(product.category_slug)?.name ?? "Uncategorised"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Available quantity: {product.stock_quantity.toLocaleString("en-KE")}</p>
                <p className="mt-1 font-medium">KES {Number(product.final_price).toLocaleString("en-KE")}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.status !== "ACTIVE" && <button className="primary-cta" disabled={actionPending} onClick={() => updateProduct(product.id, "ACTIVE")}>{product.status === "FLAGGED" ? "Restore active" : "Approve listing"}</button>}
                  {product.status === "ACTIVE" && <button className="secondary-cta" disabled={actionPending} onClick={() => updateProduct(product.id, "FLAGGED")}>Flag & hide</button>}
                  {product.status !== "ACTIVE" && <button className="secondary-cta" disabled={actionPending} onClick={() => updateProduct(product.id, "REJECTED")}>Reject</button>}
                  <button className="secondary-cta" disabled={actionPending} onClick={() => setProductToDelete(product)}>Delete permanently</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!moderationQueue.isError && !moderationQueue.isLoading && <section className="mt-12 border-t pt-10"><p className="eyebrow">Vendor governance</p><h2 className="mt-2 text-2xl font-semibold">Agreement-backed vendor applications</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Approve vendors only after confirming their identity and agreement outside the public marketplace. Suspending access stops new listing submissions; it does not delete their past listing records.</p>{vendorApplications.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading vendor applications…</p>}{vendorApplications.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No vendor applications have been submitted yet.</p>}{vendorApplications.data && vendorApplications.data.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{vendorApplications.data.map(application => <article className="rounded-2xl border bg-white p-5" key={application.id}><h3 className="font-semibold">{application.fullName || "Vendor application"}</h3><p className="mt-2 text-sm text-muted-foreground">Agreement: {application.agreementAcceptedAt ? "Recorded" : "Missing"}</p><p className="mt-1 text-sm text-muted-foreground">Status: {application.isApproved ? "Approved" : "Pending or suspended"}</p><button className="primary-cta mt-5" disabled={updateVendorApproval.isPending || !application.agreementAcceptedAt} onClick={() => updateVendorApproval.mutate({ profileId: application.id, approved: !application.isApproved })}>{application.isApproved ? "Suspend listing access" : "Approve vendor"}</button></article>)}</div>}</section>}
      </main>

      <AlertDialog open={Boolean(productToDelete)} onOpenChange={open => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>{productToDelete ? `“${productToDelete.title}” will be removed from the owner queue and cannot be restored.` : "This action cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Keep listing</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={remove.isPending} onClick={() => productToDelete && remove.mutate({ productId: productToDelete.id })}>{remove.isPending ? "Deleting…" : "Delete permanently"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MarketplaceLayout>
  );
}
