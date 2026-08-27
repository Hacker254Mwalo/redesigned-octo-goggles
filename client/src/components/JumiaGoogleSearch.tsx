import { useEffect, useRef } from "react";

type GoogleSearchSelection = {
  title: string;
  url: string;
  snippet: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
};

type JumiaGoogleSearchProps = {
  query?: string;
  onSelect: (result: GoogleSearchSelection) => void;
};

const JUMIA_HOSTS = new Set(["jumia.co.ke", "www.jumia.co.ke"]);

function isJumiaUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && JUMIA_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function searchEngineId() {
  return (import.meta.env.VITE_GOOGLE_PSE_CX as string | undefined)?.trim() || "";
}

export function hasJumiaGoogleSearch() {
  return Boolean(searchEngineId());
}

export function JumiaGoogleSearch({ query, onSelect }: JumiaGoogleSearchProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cx = searchEngineId();

  useEffect(() => {
    if (!cx || !hostRef.current) return;
    const host = hostRef.current;
    const render = () => {
      const google = (window as typeof window & { google?: { search?: { cse?: { element?: { go?: () => void } } } } }).google;
      google?.search?.cse?.element?.go?.();
    };
    const existing = document.querySelector(`script[data-mtaa-jumia-cse="${cx}"]`);
    if (existing) {
      const timeout = window.setTimeout(render, 80);
      return () => window.clearTimeout(timeout);
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://cse.google.com/cse.js?cx=${encodeURIComponent(cx)}`;
    script.dataset.mtaaJumiaCse = cx;
    script.onload = render;
    document.head.appendChild(script);
    return () => {
      if (host) host.replaceChildren();
    };
  }, [cx]);

  useEffect(() => {
    if (!query || !hostRef.current) return;
    const timeout = window.setTimeout(() => {
      const input = hostRef.current?.querySelector<HTMLInputElement>("input.gsc-input");
      const button = hostRef.current?.querySelector<HTMLButtonElement>("button.gsc-search-button");
      if (input && !input.value) {
        input.value = query;
        button?.click();
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [query]);

  function captureSelection(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    const url = anchor?.href || "";
    if (!anchor || !isJumiaUrl(url)) return;
    event.preventDefault();
    const title = anchor.textContent?.trim().replace(/\s+/g, " ") || "Jumia product";
    onSelect({ title: title.slice(0, 180), url, snippet: "Selected from Jumia Kenya search results.", imageUrl: null, price: null, currency: null });
  }

  if (!cx) return null;
  return <div className="jumia-google-search" ref={hostRef} onClick={captureSelection} aria-label="Search Jumia Kenya"><div className="gcse-search" data-as_sitesearch="jumia.co.ke" data-websearchsafesearch="active" data-resultsetsize="10" data-mobilelayout="enabled" /></div>;
}
