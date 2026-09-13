import { describe, expect, it } from "vitest";

import { redactPhi } from "./redact";
import { SAMPLE_VISITS } from "./samples";
import { soapNoteSchema } from "./soap";

describe("sample visits", () => {
  it.each(SAMPLE_VISITS.map((s) => [s.id, s] as const))("%s has a valid reference note", (_id, sample) => {
    expect(soapNoteSchema.safeParse(sample.note).success).toBe(true);
  });

  it.each(SAMPLE_VISITS.map((s) => [s.id, s] as const))(
    "%s leaves no patient name in the redacted transcript",
    (_id, sample) => {
      const { text } = redactPhi(sample.transcript, { knownNames: [sample.patientName] });
      for (const part of sample.patientName.split(" ")) {
        expect(text.toLowerCase()).not.toContain(part.toLowerCase());
      }
    },
  );

  it("masks the planted identifiers in the blood pressure visit", () => {
    const sample = SAMPLE_VISITS[0];
    const { counts } = redactPhi(sample.transcript, { knownNames: [sample.patientName] });
    expect(counts).toMatchObject({ DATE: 1, PHONE: 1, ADDRESS: 1 });
  });
});
