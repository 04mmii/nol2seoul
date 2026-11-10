import type { VercelRequest, VercelResponse } from "@vercel/node";
// ".js" extension: package.json is "type": "module", so Node's ESM loader needs it at runtime.
import { courseResponse, modelFromEnv } from "./_lib/courseServer.js";

/**
 * POST /api/course — AI course recommendation (코스추천 remote). Logic in api/_lib/courseServer.ts
 * (shared with the Vite dev server). ANTHROPIC_API_KEY is a server-only env var; without it the
 * rule-based course is returned (marked as such).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST only" });
  }
  const fwd = req.headers["x-forwarded-for"];
  const client = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  const result = await courseResponse(req.body, { client, model: modelFromEnv(process.env) });
  for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
  return res.status(result.status).json(result.body);
}
