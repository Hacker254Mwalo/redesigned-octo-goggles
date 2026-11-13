import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { Link } from "wouter";

const sections = [
  {
    title: "1. Who these terms cover",
    body: "These terms apply when you browse or use Siaya Mtaa Market (also called MtaaMarket), contact us, request an item, or place an order through the website. MtaaMarket is a local marketplace service for buyers and sellers in Siaya County. A product page identifies an approved seller or MtaaMarket Select where that information is available. We are not affiliated with Jumia or other external retailers.",
  },
  {
    title: "2. Listings and accurate information",
    body: "We aim to show clear product details, seller/source information, prices and availability. A listing is not proof that an item is physically held by MtaaMarket. Seller and supplier information can change, and external search results may be outdated. We do not describe a product as physically in stock unless that stock has been confirmed. Product photos and specifications should match the actual item; tell us promptly if a listing appears wrong.",
  },
  {
    title: "3. Local-listing orders",
    body: "When you place an order for a local listing, we record your request and check the listed item, quantity and fulfilment details. The status ‘Order placed’ means we received the request; it does not mean availability or a collection point has been confirmed. MtaaMarket will confirm the order or mark it unavailable. If it cannot be fulfilled, we cancel the order and do not collect payment. The pickup PIN is shared only after availability is confirmed. No online payment is collected through this order flow.",
  },
  {
    title: "4. MtaaMarket Select and supplier-sourced items",
    body: "Some wider-selection results are discovered on independent retailer websites and may be sourced only after you ask. They are not MtaaMarket inventory. A third-party displayed price, description or image can change and is not a supplier quote or a promise of local availability, delivery, warranty or profit. MtaaMarket checks the exact item, current price, supplier availability and Siaya fulfilment before asking you to proceed. You may decline a changed price or an unavailable option. No payment is due before you receive and accept the confirmed item, total and hand-off arrangement. External retailer terms may apply to purchases made directly on that retailer’s own website.",
  },
  {
    title: "5. Price, payment and hand-off",
    body: "For a local listing, the displayed price is the listing price; any delivery or other charge must be explained before you accept a confirmed arrangement. For a supplier-sourced request, the final item and total are confirmed with you first. That total may include a clearly disclosed sourcing or handling margin and any delivery charge. You can accept or decline the quote before payment. This site does not take online payment for these orders. Pay only using the payment instruction MtaaMarket confirms for your order, and keep your receipt. Do not send money to a seller or third party based only on an unverified message. A pickup area you enter is a preference, not a booked collection point or your home address. Exact collection or delivery details are confirmed separately.",
  },
  {
    title: "6. Changes and cancellations",
    body: "You can ask us to cancel an order request while it is still being checked and before you accept a confirmed arrangement. Contact us as soon as possible with your order reference. If an order has been confirmed, is being sourced, or has been handed over, contact us promptly so we can explain the options for that stage. Cancellation, return, refund and remedy rights provided by Kenyan law continue to apply; nothing in these terms removes them. If we cannot supply an item or the confirmed arrangement changes materially, we will tell you and discuss cancellation or another option before taking payment.",
  },
  {
    title: "7. Seller responsibilities and marketplace support",
    body: "Approved sellers must provide genuine product information, accurate prices and stock details, and honour the fulfilment arrangements they accept. MtaaMarket may pause a listing or seller access to protect customers, investigate suspected misuse, or comply with law. If an order has a delay, wrong item, quality concern or another problem, contact MtaaMarket first using the details below. We will review the order and coordinate with the seller or supplier where appropriate. This support does not take away any rights or remedies you have under Kenyan law.",
  },
  {
    title: "8. Accounts, contact details and safety",
    body: "Keep your sign-in details private and provide an accurate name and Kenyan phone number for order contact. Your phone number is used for relevant account, order and fulfilment communication and is not displayed publicly to other buyers. Do not put passwords, one-time codes, payment PINs or sensitive personal information in product requests or order notes. See our Privacy Policy for data use and ways to exercise your data rights.",
  },
  {
    title: "9. Using the website",
    body: "Do not use the website to post unlawful, misleading, counterfeit, unsafe or infringing content; interfere with its security; scrape or reuse other people’s content without permission; or impersonate another person or seller. You retain rights in content you submit and permit MtaaMarket to host, display and process it only as needed to operate your listing or request and provide related support. Do not upload content you do not have the right to use. We may remove content that breaches these terms or the law.",
  },
  {
    title: "10. Service availability and responsibility",
    body: "We work to keep the website available and correct, but it may occasionally be interrupted or contain an error. We will take reasonable steps to fix issues and protect orders. MtaaMarket is not responsible for independent third-party websites or service interruptions outside our reasonable control. Nothing in these terms excludes responsibility that cannot lawfully be excluded, or limits your consumer rights under Kenyan law. We do not promise that every requested product, price, delivery method or seller will be available.",
  },
  {
    title: "11. Complaints, contact and governing law",
    body: "For an order problem, account question, correction or cancellation request, contact us through the Request Desk or WhatsApp. Include your order reference and a short description; never send a password or one-time code. We will review the issue, explain the next step, and coordinate with a seller or supplier when needed. These terms are governed by the laws of Kenya, subject to mandatory consumer and data-protection rights and any lawful dispute process.",
  },
  {
    title: "12. Updates to these terms",
    body: "We may update these terms when the service or legal requirements change. The current version will be published on this page with its update date. A change does not remove rights that already apply to an order you placed or an agreement you accepted.",
  },
];

export default function TermsPage() {
  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="rounded-3xl bg-[#0e2f27] px-6 py-9 text-white shadow-sm sm:px-10">
          <p className="eyebrow text-[#d7a95b]">Customer and seller terms</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Clear terms for shopping and selling.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">These terms explain how requests, availability checks and hand-offs work on Siaya Mtaa Market.</p>
          <p className="mt-3 text-xs text-white/70">Last updated: 13 November 2026</p>
        </header>

        <div className="mt-8 space-y-5 text-sm leading-7 text-[#29443a]">
          <section className="rounded-2xl border border-[#dce5dc] bg-[#f4f8f5] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0e2f27]">The short version</h2>
            <p className="mt-2">An order request is not a stock promise. MtaaMarket checks availability and hand-off details before confirming. For supplier-sourced items, the final price and supply must also be confirmed with you. No online payment is collected here, and your Kenyan mobile number is kept out of public listings.</p>
          </section>

          {sections.map(section => (
            <section key={section.title} className="rounded-2xl border border-[#dce5dc] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0e2f27]">{section.title}</h2>
              <p className="mt-3">{section.body}</p>
            </section>
          ))}

          <section className="rounded-2xl border border-[#dce5dc] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0e2f27]">Contact MtaaMarket</h2>
            <p className="mt-3">For order support, send us a message on WhatsApp at <a className="font-semibold underline underline-offset-4" href="https://wa.me/254707976424" target="_blank" rel="noreferrer">+254 707 976 424</a> or use the <Link className="font-semibold underline underline-offset-4" href="/request">Request Desk</Link>.</p>
            <p className="mt-2">Read our <Link className="font-semibold underline underline-offset-4" href="/privacy">Privacy Policy</Link> for information about account and order data.</p>
          </section>
        </div>
      </main>
    </MarketplaceLayout>
  );
}
