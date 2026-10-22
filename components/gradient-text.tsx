import { cn } from "@/lib/utils";

/** Text filled with the brand's blue-to-green gradient. */
export function GradientText({
  as: Tag = "span",
  className,
  children,
}: {
  as?: "span" | "p" | "h1" | "h2";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag className={cn("inline-block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent", className)}>
      {children}
    </Tag>
  );
}
