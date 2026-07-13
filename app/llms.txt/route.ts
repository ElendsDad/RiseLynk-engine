import { site } from "@/site.config";
import { buildLlmsTxt } from "@/lib/llms";

// Serves /llms.txt, generated from the active site config and claims-walled (only
// config-provided facts). Static: emitted once at build time like the rest of the site.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(site), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
