// The track API stores country names from Intl.DisplayNames (see app/api/track),
// so the reverse lookup is built from the same source instead of a hand-typed table.

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let codesByName: Map<string, string> | undefined;

function buildIndex(): Map<string, string> {
  const names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  const index = new Map<string, string>();
  for (const a of LETTERS) {
    for (const b of LETTERS) {
      const code = a + b;
      const name = names.of(code);
      if (name && name !== code) index.set(name.toLowerCase(), code.toLowerCase());
    }
  }
  return index;
}

/** Flag image for a country name; the UN flag when the name is unknown. */
export function flagUrl(countryName: string): string {
  codesByName ??= buildIndex();
  const code = codesByName.get(countryName.toLowerCase()) ?? "un";
  return `https://flagcdn.com/256x192/${code}.png`;
}
