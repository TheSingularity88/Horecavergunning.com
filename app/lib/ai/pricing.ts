import 'server-only';

/**
 * Rough per-model token pricing, used only to store a cost ESTIMATE on ai_runs
 * so the admin dashboard can show spend. Not a billing source of truth — the
 * provider's own invoice is. Prices are USD per million tokens; we store the
 * estimate in euro cents with a fixed, conservative FX so the figure is never
 * flatteringly low.
 *
 * Keep this list short and current models only. An unknown model returns null
 * (the run still records; the cost column is simply blank).
 */

interface ModelPrice {
  inputPerMTokUsd: number;
  outputPerMTokUsd: number;
}

const PRICES: Record<string, ModelPrice> = {
  'claude-opus-5': { inputPerMTokUsd: 5, outputPerMTokUsd: 25 },
  'claude-sonnet-5': { inputPerMTokUsd: 3, outputPerMTokUsd: 15 },
  'claude-haiku-4-5': { inputPerMTokUsd: 1, outputPerMTokUsd: 5 },
};

// Deliberately high so the estimate errs upward, never downward.
const USD_TO_EUR = 1.0;

export function estimateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const price = PRICES[model];
  if (!price) return null;
  const usd =
    (inputTokens / 1_000_000) * price.inputPerMTokUsd +
    (outputTokens / 1_000_000) * price.outputPerMTokUsd;
  return Math.round(usd * USD_TO_EUR * 100 * 10000) / 10000; // 4dp cents
}
