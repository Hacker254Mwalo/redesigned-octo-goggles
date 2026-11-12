import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Search, ShieldCheck, Store, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type AccountKind = "all" | "buyer" | "vendor" | "admin";
const PER_PAGE = 25;

function accountKind(account: { role: string; is_vendor: boolean }) {
  if (account.role === "admin") return "admin";
  return account.is_vendor ? "vendor" : "buyer";
}

function kindLabel(kind: string) {
  if (kind === "admin") return "Admin";
  if (kind === "vendor") return "Vendor";
  return "Buyer";
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function OwnerAccountDirectory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<AccountKind>("all");
  const accountsQuery = trpc.marketplace.v3OwnerAccounts.useQuery({ page, perPage: PER_PAGE }, { retry: false });
  const accounts = accountsQuery.data?.accounts ?? [];
  const filteredAccounts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return accounts.filter(account => {
      const matchesKind = kind === "all" || accountKind(account) === kind;
      const searchable = `${account.displayName ?? ""} ${account.email ?? ""}`.toLowerCase();
      return matchesKind && (!needle || searchable.includes(needle));
    });
  }, [accounts, kind, search]);
  const hasNextPage = accounts.length === PER_PAGE;

  return (
    <section className="owner-console-section owner-account-directory" aria-labelledby="owner-account-directory-title">
      <div className="owner-section-heading">
        <UsersRound aria-hidden="true" />
        <div>
          <p className="eyebrow">People at the market</p>
          <h2 id="owner-account-directory-title" className="mt-2 text-2xl font-semibold">Buyer and vendor accounts</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A protected directory for account type and vendor-access status. Contact numbers stay out of this view.</p>
        </div>
      </div>

      <div className="owner-account-tools">
        <label className="owner-account-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search accounts on this page</span>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search this page by name or email" />
        </label>
        <label className="owner-account-filter">
          <span>Account type</span>
          <select value={kind} onChange={event => { setKind(event.target.value as AccountKind); setPage(1); }}>
            <option value="all">All accounts</option>
            <option value="buyer">Buyers</option>
            <option value="vendor">Vendors</option>
            <option value="admin">Admins</option>
          </select>
        </label>
      </div>

      {accountsQuery.isLoading && <p className="owner-account-message" aria-live="polite">Loading protected account records…</p>}
      {accountsQuery.isError && <p className="owner-account-message owner-account-error" role="alert">The account directory could not be loaded. Refresh the page and try again.</p>}
      {!accountsQuery.isLoading && !accountsQuery.isError && accountsQuery.data && (
        <>
          {filteredAccounts.length === 0 ? <p className="owner-account-message">{accounts.length ? "No accounts on this page match those filters." : "No registered accounts were found."}</p> : (
            <div className="owner-account-list">
              {filteredAccounts.map(account => {
                const type = accountKind(account);
                const Icon = type === "admin" ? ShieldCheck : type === "vendor" ? Store : UserRound;
                return (
                  <article className="owner-account-row" key={account.id}>
                    <span className={`owner-account-icon owner-account-icon-${type}`}><Icon size={18} aria-hidden="true" /></span>
                    <div className="owner-account-main">
                      <strong>{account.displayName || "Name not added"}</strong>
                      <span>{account.email || "Email unavailable"}</span>
                    </div>
                    <span className={`owner-account-kind owner-account-kind-${type}`}>{kindLabel(type)}</span>
                    {type === "vendor" && <span className={`owner-account-status ${account.is_vendor_approved ? "is-approved" : "is-pending"}`}>{account.is_vendor_approved ? "Approved to publish" : "Not approved"}</span>}
                    <time dateTime={account.created_at}>Joined {dateLabel(account.created_at)}</time>
                  </article>
                );
              })}
            </div>
          )}
          <div className="owner-account-pagination">
            <span>{accountsQuery.data.total === null ? `Page ${page}` : `${accountsQuery.data.total.toLocaleString("en-KE")} total accounts · Page ${page}`}</span>
            <div>
              <button type="button" className="secondary-cta" disabled={page <= 1 || accountsQuery.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))}><ChevronLeft size={15} />Previous</button>
              <button type="button" className="secondary-cta" disabled={!hasNextPage || accountsQuery.isFetching} onClick={() => setPage(current => current + 1)}>Next<ChevronRight size={15} /></button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
