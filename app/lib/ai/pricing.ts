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
  // Reachable without anyone selecting it: the Anthropic client enables
  // server-side fallbacks, so a refused request can be served by a different
  // model and the response reports THAT model back to us.
  'claude-opus-4-8': { inputPerMTokUsd: 5, outputPerMTokUsd: 25 },
  'claude-sonnet-5': { inputPerMTokUsd: 3, outputPerMTokUsd: 15 },
  'claude-haiku-4-5': { inputPerMTokUsd: 1, outputPerMTokUsd: 5 },
};

// Deliberately high so the estimate errs upward, never downward.
const USD_TO_EUR = 1.0;

/**
 * Price a run, in euro cents.
 *
 * The model string is whatever the API REPORTED, which is not necessarily the
 * alias that was requested: `claude-haiku-4-5` comes back as the resolved
 * snapshot `claude-haiku-4-5-20251001`, and a server-side fallback comes back
 * as the model that actually answered. An exact-key lookup therefore missed
 * constantly, and a miss returned null, which the dashboard summed as ZERO —
 * real spend rendered as "€ 0,00" with nothing on screen to suggest otherwise.
 *
 * So: longest-prefix match, and a loud warning on a genuine miss. A miss still
 * returns null rather than guessing a price; the dashboard counts unpriced runs
 * separately so an incomplete total is never shown as a complete one.
 */
// Provider cache economics: writing a prefix to the cache costs a 25%
// surcharge on those tokens; reading it back costs a tenth.
const CACHE_WRITE_FACTOR = 1.25;
const CACHE_READ_FACTOR = 0.1;

export function estimateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens = 0,
  cacheReadTokens = 0,
): number | null {
  const price = PRICES[model] ?? PRICES[longestPrefixKey(model)];
  if (!price) {
    console.warn('[ai-pricing] no price entry for model, cost not estimated:', model);
    return null;
  }
  const usd =
    (inputTokens / 1_000_000) * price.inputPerMTokUsd +
    (cacheWriteTokens / 1_000_000) * price.inputPerMTokUsd * CACHE_WRITE_FACTOR +
    (cacheReadTokens / 1_000_000) * price.inputPerMTokUsd * CACHE_READ_FACTOR +
    (outputTokens / 1_000_000) * price.outputPerMTokUsd;
  return Math.round(usd * USD_TO_EUR * 100 * 10000) / 10000; // 4dp cents
}

/** The longest PRICES key that `model` starts with, or '' if none does. */
function longestPrefixKey(model: string): string {
  return Object.keys(PRICES)
    .filter((key) => model.startsWith(key))
    .sort((a, b) => b.length - a.length)[0] ?? '';
}
