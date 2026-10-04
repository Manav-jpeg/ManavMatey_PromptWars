export const LIMITS = { decision: 300, details: 2000, priorities: 500 } as const;

export type AnalyzeInput = { decision: string; details: string; priorities: string };
export type AnalyzeResult = {
  summary: string;
  unstatedAssumptions: string[];
  hiddenTradeOffs: string[];
  criticalQuestions: string[];
};

const clean = (v: unknown): string | null =>
  typeof v === 'string' ? v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim() : null;

export function validateInput(
  body: unknown
): { ok: true; value: AnalyzeInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid request.' };
  }
  const b = body as Record<string, unknown>;
  const decision = clean(b.decision);
  const details = clean(b.details ?? '');
  const priorities = clean(b.priorities ?? '');

  if (!decision) return { ok: false, error: 'Please describe the decision you are considering.' };
  if (details === null || priorities === null) return { ok: false, error: 'Invalid request.' };
  if (decision.length > LIMITS.decision)
    return { ok: false, error: `Decision must be under ${LIMITS.decision} characters.` };
  if (details.length > LIMITS.details)
    return { ok: false, error: `Details must be under ${LIMITS.details} characters.` };
  if (priorities.length > LIMITS.priorities)
    return { ok: false, error: `Priorities must be under ${LIMITS.priorities} characters.` };

  return { ok: true, value: { decision, details, priorities } };
}

const isStrArr = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

export function parseResult(text: string | undefined): AnalyzeResult | null {
  if (!text) return null;
  try {
    const d = JSON.parse(text);
    if (
      typeof d.summary === 'string' &&
      isStrArr(d.unstatedAssumptions) &&
      isStrArr(d.hiddenTradeOffs) &&
      isStrArr(d.criticalQuestions)
    ) {
      return d as AnalyzeResult;
    }
  } catch {}
  return null;
}