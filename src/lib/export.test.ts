import { describe, expect, it } from "vitest";

import { toFhirDocumentReference, toMarkdown, type ExportableNote } from "./export";
import { SAMPLE_VISITS } from "./samples";
import { emptySoapNote } from "./soap";

const base: ExportableNote = {
  id: "33333333-3333-4333-8333-333333333333",
  title: SAMPLE_VISITS[0].title,
  status: "final",
  content: SAMPLE_VISITS[0].note,
  createdAt: new Date("2026-10-20T14:00:00Z"),
  finalizedAt: new Date("2026-10-21T09:30:00Z"),
};

describe("toMarkdown", () => {
  it("renders every SOAP section, medications, follow-up and gaps", () => {
    const md = toMarkdown(base);
    expect(md).toMatch(/^# Blood pressure & diabetes follow-up\n/);
    expect(md).toContain("_Finalized 2026-10-21_");
    for (const heading of ["Subjective", "Objective", "Assessment", "Plan", "Medications", "Follow-up"]) {
      expect(md).toContain(`## ${heading}`);
    }
    expect(md).toContain("- **Losartan** 50 mg, once daily (New)");
    expect(md).toContain("- **Lisinopril** 10 mg, once daily (Stopped)");
    expect(md).toContain("## Not covered in the visit\n\n- Allergies not reviewed");
  });

  it("marks drafts and empty sections clearly", () => {
    const md = toMarkdown({ ...base, status: "draft", finalizedAt: null, content: emptySoapNote() });
    expect(md).toContain("_Draft, not yet reviewed_");
    expect(md).toContain("## Plan\n\n_Not documented._");
    expect(md).not.toContain("## Medications");
  });
});

describe("toFhirDocumentReference", () => {
  it("builds a LOINC-typed DocumentReference with the Markdown attached", () => {
    const doc = toFhirDocumentReference(base);
    expect(doc).toMatchObject({
      resourceType: "DocumentReference",
      status: "current",
      docStatus: "final",
      type: { coding: [{ system: "http://loinc.org", code: "11506-3" }] },
      date: "2026-10-21T09:30:00.000Z",
    });
    const decoded = Buffer.from(doc.content[0].attachment.data, "base64").toString("utf8");
    expect(decoded).toBe(toMarkdown(base));
  });

  it("marks drafts as preliminary and preserves non-ASCII text", () => {
    const doc = toFhirDocumentReference({
      ...base,
      status: "draft",
      finalizedAt: null,
      content: { ...base.content, objective: "Temp 38.2°C — febrile" },
    });
    expect(doc.docStatus).toBe("preliminary");
    expect(doc.date).toBe("2026-10-20T14:00:00.000Z");
    expect(Buffer.from(doc.content[0].attachment.data, "base64").toString("utf8")).toContain("38.2°C — febrile");
  });
});
