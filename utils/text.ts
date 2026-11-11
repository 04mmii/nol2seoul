/**
 * HTML from the Seoul APIs (space FAC_DESC, night-spot CONTENTS) → plain-text paragraphs.
 * Block tags become line breaks, all other tags are removed, common entities decoded. Always render
 * the result as text (never as HTML), so nothing from the API is injected into the page.
 */
const ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&middot;': '·' };

export function htmlToParagraphs(html?: string): string[] {
  if (!html) return [];
  const text = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|h[1-6]|li|tr)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|middot);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  return text.split(/\n+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

