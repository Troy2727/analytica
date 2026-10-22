import { oneDark, SyntaxHighlighter } from "@/lib/syntax-highlighter";

const frame: React.CSSProperties = {
  padding: "1rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(96, 165, 250, 0.2)",
  background: "rgba(2, 6, 23, 0.7)",
  overflowX: "auto",
};

/** A highlighted, horizontally scrollable code sample. */
export default function CodePanel({ code, language }: { code: string; language: string }) {
  return (
    <SyntaxHighlighter language={language} style={oneDark} customStyle={frame}>
      {code}
    </SyntaxHighlighter>
  );
}
