export function normalizeKenyanMobilePhone(input: string): string | null {
  const value = input.trim().replace(/[\s-]/g, "");
  let canonical: string;
  if (/^0[17]\d{8}$/.test(value)) canonical = `254${value.slice(1)}`;
  else if (/^\+?254[17]\d{8}$/.test(value)) canonical = value.replace(/^\+/, "");
  else return null;
  return canonical;
}
