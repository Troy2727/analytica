import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** The navy glass card every dashboard section sits in. */
export function Panel({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("border-navy-800 bg-gradient-to-br from-blue-900/20 to-black backdrop-blur-sm", className)}
      {...props}
    />
  );
}

/** Link to the README, used wherever a section needs setup help. */
export function DocsLink({ children = "documentation" }: { children?: React.ReactNode }) {
  return (
    <a
      href="https://github.com/Troy2727/analytica#readme"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline hover:text-blue-300"
    >
      {children}
    </a>
  );
}
