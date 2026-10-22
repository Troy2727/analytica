import { Code2 } from "lucide-react";
import CodePanel from "@/components/code-panel";
import CopyButton from "@/components/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ENDPOINT = "https://analytica-phi.vercel.app/api/events";

const EXAMPLES = [
  {
    id: "javascript",
    label: "JavaScript",
    code: `// Node 18+ or any browser: no dependencies needed
const API_KEY = "YOUR_API_KEY";

async function trackEvent(event) {
  const response = await fetch("${ENDPOINT}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${API_KEY}\`,
    },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    throw new Error(\`Analytica returned \${response.status}: \${await response.text()}\`);
  }
  return response.json();
}

trackEvent({
  name: "new_signup",          // required
  domain: "example.com",       // required: a website on your dashboard
  description: "A user signed up", // required
  emoji: "🎉",                 // optional, shown in the Discord message
  fields: [                    // optional extra rows in the Discord message
    { name: "Plan", value: "Pro", inline: true },
  ],
})
  .then((result) => console.log("Event sent:", result))
  .catch((error) => console.error(error));`,
  },
  {
    id: "python",
    label: "Python",
    code: `import requests

API_KEY = "YOUR_API_KEY"

def track_event(event: dict) -> dict:
    response = requests.post(
        "${ENDPOINT}",
        json=event,
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()

try:
    result = track_event({
        "name": "new_signup",            # required
        "domain": "example.com",         # required: a website on your dashboard
        "description": "A user signed up",  # required
        "emoji": "🎉",                   # optional, shown in the Discord message
        "fields": [                      # optional extra rows in the Discord message
            {"name": "Plan", "value": "Pro", "inline": True},
        ],
    })
    print("Event sent:", result)
except requests.RequestException as error:
    print("Analytica request failed:", error)`,
  },
];

/** Copy-ready examples of sending a custom event to the events API. */
export default function ApiExamples() {
  return (
    <Tabs defaultValue={EXAMPLES[0].id} className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2 bg-navy-800">
        {EXAMPLES.map((e) => (
          <TabsTrigger key={e.id} value={e.id} className="data-[state=active]:bg-navy-700 data-[state=active]:text-neutral-100">
            {e.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {EXAMPLES.map((e) => (
        <TabsContent
          key={e.id}
          value={e.id}
          className="overflow-hidden rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium text-neutral-300">
              <Code2 className="h-5 w-5 text-neutral-400" />
              Example Code
            </span>
            <CopyButton text={e.code} what="Code" className="border-navy-700" />
          </div>
          <CodePanel code={e.code} language={e.id} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
