const MAX_LENGTH = 2048;
const CONTROL_OR_SPACE = /[\u0000- \u007f]/;

/**
 * A clicked link's URL as stored: http(s) origin plus path, with the query,
 * fragment and any credentials dropped and the host lower-cased. Null when the
 * value is not a plain absolute http(s) URL of at most 2048 characters.
 */
export function normalizeLinkUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw || raw.length > MAX_LENGTH || CONTROL_OR_SPACE.test(raw)) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const normalized = `${url.protocol}//${url.host}${url.pathname}`;
  return normalized.length <= MAX_LENGTH ? normalized : null;
}
