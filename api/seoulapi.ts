import type { VercelRequest, VercelResponse } from "@vercel/node";
// ".js" extension: package.json is "type": "module", so Node's ESM loader needs it at runtime.
import { seoulApiResponse } from "./_lib/seoulApi.js";

/**
 * Vercel serverless proxy for the Seoul Open API. All logic lives in api/_lib/seoulApi.ts
 * (shared with the Vite dev server). type=event merges rows 1–4,000 and drops ended events (TECH-10).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const result = await seoulApiResponse(type, process.env.SEOUL_API_KEY);
  for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
  return res.status(result.status).json(result.body);
}
