export type Query = Record<
  string,
  (string | number | boolean)[] | string | number | boolean | null | undefined
>;

const DEFAULT_DEBUG = import.meta.env?.DEV ?? false;

export function buildUrl(
  base: string | URL, //start with https:// or http://
  endpoints: string | string[] = "", // "users" or ["users", id, "repos"]
  query?: Query,
  debug: boolean = DEFAULT_DEBUG,
): URL {
  const url = base instanceof URL ? new URL(base.toString()) : new URL(base);

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
