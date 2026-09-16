import { describe, expect, it, vi } from "vitest";

import { SAMPLE_VISITS } from "@/lib/samples";
import { emptySoapNote } from "@/lib/soap";
import { demoGenerator, draftNote, GenerationError, type NoteGenerator } from "./generate";

describe("draftNote", () => {
  it("only ever passes redacted text to the generator", async () => {
    const generate = vi.fn<NoteGenerator["generate"]>(async () => emptySoapNote());
    await draftNote("Patient Jane Roe, phone 555-123-4567, DOB 01/02/1980.", {
      knownNames: ["Jane Roe"],
      generator: { source: "ai", generate },
    });

    const sent = generate.mock.calls[0][0];
    expect(sent).not.toMatch(/Jane|Roe|555-123-4567|01\/02\/1980/);
    expect(sent).toContain("[PHONE]");
  });

  it("rejects generator output that doesn't match the SOAP schema", async () => {
    const generator: NoteGenerator = { source: "ai", generate: async () => ({ subjective: 1 }) as never };
    await expect(draftNote("text", { generator })).rejects.toThrow();
  });
});

describe("demoGenerator", () => {
  it.each(SAMPLE_VISITS.map((s) => [s.id, s] as const))("returns the reference note for %s", async (_id, sample) => {
    const result = await draftNote(sample.transcript, { knownNames: [sample.patientName], generator: demoGenerator });
    expect(result).toMatchObject({ source: "demo", note: sample.note });
  });

  it("tolerates whitespace differences in a pasted sample", async () => {
    const sample = SAMPLE_VISITS[1];
    const pasted = sample.transcript.replace(/\n/g, "\n\n  ");
    await expect(
      draftNote(pasted, { knownNames: [sample.patientName], generator: demoGenerator }),
    ).resolves.toMatchObject({ note: sample.note });
  });

  it("explains how to enable AI for other transcripts", async () => {
    await expect(draftNote("Doctor: Hello. Patient: Hi.", { generator: demoGenerator })).rejects.toThrow(
      GenerationError,
    );
  });
});
