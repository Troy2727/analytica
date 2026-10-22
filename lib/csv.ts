/** Quote a cell per RFC 4180, and defuse values a spreadsheet would run as a formula. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows to CSV text, using the first row's keys as the header. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const lines = rows.map((row) => columns.map((c) => cell(row[c])).join(","));
  return [columns.join(","), ...lines].join("\n");
}

/** Make the browser download `rows` as a CSV file. Does nothing for no rows. */
export function downloadCsv(rows: Record<string, unknown>[], filename: string): void {
  const csv = toCsv(rows);
  if (!csv) return;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
