export type Query = Record<
  string,
  (string | number | boolean)[] | string | number | boolean | null | undefined
>;

const DEFAULT_DEBUG = import.meta.env?.DEV ?? false;

export function buildUrl(
  base: string | URL, // absolute (https://...) or app-relative (e.g., "/api/v2")
  endpoints: string | string[] = "", // "users" or ["users", id, "repos"]
  query?: Query,
  debug: boolean = DEFAULT_DEBUG,
): URL {
  const url = (() => {
    if (base instanceof URL) return new URL(base.toString());
    const b = String(base);
    // Support app-relative bases like "/api/v1" by resolving against current origin
    if (b.startsWith("/")) {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";
      return new URL(b, origin || undefined);
    }
    return new URL(b);
  })();

  // stitch path segments
  const segments = Array.isArray(endpoints) ? endpoints : [endpoints];
  url.pathname = [
    url.pathname.replace(/\/$/, ""), // strip trailing /
    ...segments.map(
      (s) => encodeURIComponent(s.replace(/^\/|\/$/g, "")), // trim & encode
    ),
  ]
    .filter(Boolean)
    .join("/");

  // attach query params
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v == null) return; // skip null / undefined

      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, String(item)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }

  // optional logging
  if (debug) console.debug("[debug] Built URL:", url.toString());

  return url;
}

/* avoid .toString everywhere */
export const buildUrlString = (...args: Parameters<typeof buildUrl>) =>
  buildUrl(...args).toString();
