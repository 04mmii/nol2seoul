/**
 * Server side of the course remote: rate limit → cache → Anthropic (when ANTHROPIC_API_KEY is set)
 * → validate; otherwise / on any failure, the rule-based course. Shared by api/course.ts (Vercel)
 * and the Vite dev middleware. The key is read on the server only and never sent to the browser.
 *
 * Cost protection:
 *  - same input → cached result (in-memory, 1 h, 300 entries; per server instance);
 *  - per client: at most 1 request / 3 s and 8 / 10 min (in-memory, per instance — best effort on
 *    serverless; documented in docs/deploy-checklist.md).
 */
import Anthropic from '@anthropic-ai/sdk';
// ".js" extension: package.json is "type": "module" (Node ESM on Vercel).
import { COURSE_SCHEMA, COURSE_SYSTEM, cacheKey, coursePrompt, ruleCourse, sanitizeRequest, validateAiCourse, type CourseRequest, type CourseResult } from './course.js';

export const COURSE_MODEL = 'claude-opus-5-5';

/** Model call, injectable for tests (tests never call the paid API). Returns the parsed JSON or throws. */
export type CourseModel = (req: CourseRequest) => Promise<unknown>;

export function anthropicModel(apiKey: string): CourseModel {
  const client = new Anthropic({ apiKey, timeout: 25_000, maxRetries: 1 });
  return async (req) => {
    const res = await client.beta.messages.create({
      model: COURSE_MODEL,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: COURSE_SCHEMA as unknown as Record<string, unknown> } },
      system: COURSE_SYSTEM,
      messages: [{ role: 'user', content: coursePrompt(req) }],
    });
    if (res.stop_reason === 'refusal') throw new Error('refusal');
    const text = res.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text;
    if (!text) throw new Error('empty');
    return JSON.parse(text);
  };
}

type Entry = { at: number; value: CourseResult };
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_MAX = 300;
const cache = new Map<string, Entry>();
const hits = new Map<string, number[]>();
export const RATE = { minGapMs: 3_000, windowMs: 10 * 60 * 1000, maxInWindow: 8 } as const;

/** Test hook: clear in-memory state. */
export function resetCourseState() { cache.clear(); hits.clear(); }

function rateLimited(client: string, now: number): boolean {
  const list = (hits.get(client) ?? []).filter((t) => now - t < RATE.windowMs);
  const last = list[list.length - 1];
  if ((last !== undefined && now - last < RATE.minGapMs) || list.length >= RATE.maxInWindow) {
    hits.set(client, list);
    return true;
  }
  list.push(now);
  hits.set(client, list);
  return false;
}

export type CourseHttp = { status: number; body: CourseResult | { error: string }; headers: Record<string, string> };

export async function courseResponse(body: unknown, opts: { client: string; model: CourseModel | null; now?: number }): Promise<CourseHttp> {
  const headers = { 'Cache-Control': 'no-store' };
  const req = sanitizeRequest(body);
  if (!req) return { status: 400, body: { error: '코스를 짤 후보가 부족해요.' }, headers };

  const key = cacheKey(req);
  const now = opts.now ?? Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_TTL) return { status: 200, body: hit.value, headers: { ...headers, 'X-Course-Cache': 'hit' } };

  // Rule-based courses cost nothing; only model calls are rate limited.
  if (!opts.model) return { status: 200, body: ruleCourse(req, 'AI 연결이 없어 기본 규칙으로 짠 코스예요.'), headers };
  if (rateLimited(opts.client, now)) return { status: 429, body: { error: '요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.' }, headers: { ...headers, 'Retry-After': '10' } };

  let value: CourseResult;
  try {
    value = validateAiCourse(await opts.model(req), req);
  } catch {
    value = ruleCourse(req, 'AI 응답을 받지 못해 기본 규칙으로 짠 코스예요.');
    return { status: 200, body: value, headers }; // failures aren't cached
  }
  cache.set(key, { at: now, value });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return { status: 200, body: value, headers };
}

/** Model from the environment: Anthropic when ANTHROPIC_API_KEY is set (and not disabled for tests). */
export function modelFromEnv(env: Record<string, string | undefined>): CourseModel | null {
  if (env.COURSE_AI_DISABLED === '1') return null;
  return env.ANTHROPIC_API_KEY ? anthropicModel(env.ANTHROPIC_API_KEY) : null;
}
