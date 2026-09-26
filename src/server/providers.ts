import "server-only";

import { getClaudeGenerator } from "./claude";
import { demoGenerator, type NoteGenerator } from "./generate";

export type ProviderInfo = { id: "anthropic" | "demo"; label: string };

/** Claude when ANTHROPIC_API_KEY is set, otherwise demo mode with the sample visits. */
export function getGenerator(): { generator: NoteGenerator; provider: ProviderInfo } {
  const claude = getClaudeGenerator();
  if (claude) return { generator: claude, provider: { id: "anthropic", label: "Claude" } };
  return { generator: demoGenerator, provider: { id: "demo", label: "Demo mode" } };
}
