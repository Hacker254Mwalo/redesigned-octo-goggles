export function requestDeskHref(search: string) {
  const term = search.trim().slice(0, 180);
  return term ? `/request?item=${encodeURIComponent(term)}` : "/request";
}

export function searchEmptyHeading(search: string) {
  return search.trim() ? `No verified listing matches “${search.trim().slice(0, 80)}” yet.` : "The market is preparing its first verified listings.";
}
