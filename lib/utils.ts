type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

// UTC keeps server and browser output identical, so SSR and hydration never disagree.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "" : DATE_FORMAT.format(time);
}

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
];

export function timeAgo(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";

  const diffSeconds = Math.round((time - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 60) return "just now";

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (absSeconds >= unitSeconds) {
      return RELATIVE_FORMAT.format(Math.round(diffSeconds / unitSeconds), unit);
    }
  }
  return RELATIVE_FORMAT.format(Math.round(diffSeconds / 60), "minute");
}

const COUNT_FORMAT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCount(n: number): string {
  return COUNT_FORMAT.format(n);
}

type QueryValue = string | number | undefined | null;

export function buildQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

// Merges updates into the current params; a null/undefined/'' update removes that key.
export function withParams(
  current: Record<string, string | undefined>,
  updates: Record<string, QueryValue>,
): string {
  return buildQueryString({ ...current, ...updates });
}
