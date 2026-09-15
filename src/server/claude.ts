import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

import { soapNoteSchema } from "@/lib/soap";
import { GenerationError, type NoteGenerator } from "./generate";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

const SYSTEM_PROMPT = `You are a clinical scribe. You turn a doctor-patient visit transcript into a SOAP note
that the clinician will review and edit before signing.

Rules:
- Use only information stated in the transcript. Never invent vitals, exam findings, doses or diagnoses.
- If something a complete note would normally include is missing, leave it out of the note and list it
  in missingInfo instead (for example "Allergies not reviewed").
- Identifiers have been replaced with placeholders such as [NAME 1], [DATE] or [PHONE]. Keep placeholders
  as they are and do not guess what they stand for. Avoid repeating them unless clinically necessary.
- Write in concise, professional clinical language. Standard abbreviations (BP, HR, A1c, PRN) are fine.
- Medications: list every drug discussed, marking whether it is new, continued, changed or stopped.`;

let client: Anthropic | undefined;

/** Claude-backed generator, or undefined when no API key is configured. */
export function getClaudeGenerator(): NoteGenerator | undefined {
  if (!process.env.ANTHROPIC_API_KEY) return undefined;
  client ??= new Anthropic({ timeout: 90_000, maxRetries: 1 });

  return {
    source: "ai",
    async generate(redactedTranscript) {
      const response = await client!.beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "medium", format: betaZodOutputFormat(soapNoteSchema) },
        // If a safety classifier declines, retry server-side on the recommended fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Visit transcript:\n\n${redactedTranscript}` }],
      });

      if (response.stop_reason === "refusal") {
        throw new GenerationError(
          "The AI model declined to draft this note. Please review the transcript and try again.",
        );
      }
      if (response.stop_reason === "max_tokens" || !response.parsed_output) {
        throw new GenerationError("The draft came back incomplete. Try again, or shorten the transcript.");
      }
      return response.parsed_output;
    },
  };
}
