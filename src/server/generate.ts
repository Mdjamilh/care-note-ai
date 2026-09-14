import { redactPhi, type RedactionResult } from "@/lib/redact";
import { SAMPLE_VISITS } from "@/lib/samples";
import { soapNoteSchema, type SoapNote } from "@/lib/soap";

/** Turns an already-redacted transcript into a SOAP note. */
export type NoteGenerator = {
  source: "ai" | "demo";
  generate: (redactedTranscript: string) => Promise<SoapNote>;
};

/** An expected failure whose message is safe to show to the user. */
export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Without an AI provider, recognise the built-in sample transcripts (after
 * redaction) and return their hand-written reference notes.
 */
export const demoGenerator: NoteGenerator = {
  source: "demo",
  async generate(redactedTranscript) {
    const target = normalize(redactedTranscript);
    const sample = SAMPLE_VISITS.find(
      (s) => normalize(redactPhi(s.transcript, { knownNames: [s.patientName] }).text) === target,
    );
    if (!sample) {
      throw new GenerationError(
        "Demo mode can only draft notes for the sample visits. Set ANTHROPIC_API_KEY to draft notes from your own transcripts.",
      );
    }
    return sample.note;
  },
};

export type GenerationResult = {
  redaction: RedactionResult;
  note: SoapNote;
  source: NoteGenerator["source"];
};

/** Redacts first, then drafts, so raw identifiers never reach the generator. */
export async function draftNote(
  transcript: string,
  { knownNames = [], generator }: { knownNames?: string[]; generator: NoteGenerator },
): Promise<GenerationResult> {
  const redaction = redactPhi(transcript, { knownNames });
  const note = soapNoteSchema.parse(await generator.generate(redaction.text));
  return { redaction, note, source: generator.source };
}
