"use client";

import CodePanel from "@/components/code-panel";
import CopyButton from "@/components/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SCRIPT_URL = "https://analytica-phi.vercel.app/tracking-script.js";

/** Install instructions for plain HTML/React (`<script>`) and Next.js (`<Script>`). */
function installOptions(domain: string) {
  return [
    {
      id: "html",
      tab: "JavaScript / React.js",
      where: "Add to your index.html:",
      language: "html",
      code: `<script\n  defer\n  data-domain="${domain}"\n  src="${SCRIPT_URL}"\n></script>`,
    },
    {
      id: "next",
      tab: "Next.js",
      where: "Add to your app/layout.tsx:",
      language: "jsx",
      code: `<Script\n  defer\n  data-domain="${domain}"\n  src="${SCRIPT_URL}"\n/>`,
    },
  ];
}

/** Tabbed tracking-script snippet for one domain, with copy buttons. */
export default function InstallSnippet({ domain }: { domain: string }) {
  const options = installOptions(domain);
  return (
    <Card className="rounded-xl border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black">
      <CardContent className="pt-6">
        <Tabs defaultValue={options[0].id}>
          <TabsList className="grid w-full grid-cols-2 bg-navy-800/50">
            {options.map((o) => (
              <TabsTrigger
                key={o.id}
                value={o.id}
                className="text-neutral-400 data-[state=active]:bg-blue-600/80 data-[state=active]:text-neutral-100"
              >
                {o.tab}
              </TabsTrigger>
            ))}
          </TabsList>
          {options.map((o) => (
            <TabsContent
              key={o.id}
              value={o.id}
              className="mt-4 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-neutral-400">{o.where}</p>
                <CopyButton text={o.code} what="Snippet" />
              </div>
              <CodePanel code={o.code} language={o.language} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
