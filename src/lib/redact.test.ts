import { describe, expect, it } from "vitest";

import { redactPhi } from "./redact";

describe("redactPhi", () => {
  it("masks contact details and government identifiers", () => {
    const { text, counts } = redactPhi(
      "Call me at (555) 123-4567 or 555.987.6543, email jane.doe@example.com. SSN 123-45-6789.",
    );
    expect(text).toBe("Call me at [PHONE] or [PHONE], email [EMAIL]. SSN [SSN].");
    expect(counts).toEqual({ PHONE: 2, EMAIL: 1, SSN: 1 });
  });

  it("masks medical record numbers but keeps the label", () => {
    expect(redactPhi("MRN: 00482913 on file").text).toBe("MRN: [MRN] on file");
    expect(redactPhi("Her medical record number A-77120 was checked").text).toContain("number [MRN] was");
  });

  it("masks dates in common formats", () => {
    const { text } = redactPhi("Seen 03/14/2026, again on 2026-04-02, born March 3rd, 1961 and 12th of June.");
    expect(text).toBe("Seen [DATE], again on [DATE], born [DATE] and [DATE].");
  });

  it("masks street addresses and ZIP codes", () => {
    const { text } = redactPhi("I live at 42 Maple Grove Lane, Springfield, IL 62704.");
    expect(text).toBe("I live at [ADDRESS], Springfield, IL [ZIP].");
  });

  it("aggregates ages over 89 as required by Safe Harbor", () => {
    expect(redactPhi("A 93-year-old woman and a 45 year old man").text).toBe("A 90+-year-old woman and a 45 year old man");
  });

  it("masks names after honorifics and introductions, numbering distinct people", () => {
    const { text } = redactPhi("Hi, I'm Dr. Alvarez. My name is Maria Lopez. Dr. Alvarez will see you, Mrs. Lopez.");
    expect(text).toBe("Hi, I'm Dr. [NAME 1]. My name is [NAME 2]. Dr. [NAME 1] will see you, Mrs. [NAME 3].");
  });

  it("redacts known patient names everywhere, including first or last name alone", () => {
    const { text } = redactPhi("Thanks Maria. maria said Lopez family history is clear.", { knownNames: ["Maria Lopez"] });
    expect(text).toBe("Thanks [NAME 1]. [NAME 1] said [NAME 2] family history is clear.");
  });

  it("does not treat common phrases as names", () => {
    expect(redactPhi("I'm Fine, this is Just a check-up.").redactions).toHaveLength(0);
  });

  it("leaves clinical numbers alone", () => {
    const sample = "BP 128/82, pulse 76, A1c 6.9, taking 20 mg twice daily, walks 10000 steps.";
    expect(redactPhi(sample).text).toBe(sample);
  });

  it("reports positions that map back to the original text", () => {
    const source = "Email a@b.co today";
    const [r] = redactPhi(source).redactions;
    expect(source.slice(r.start, r.end)).toBe("a@b.co");
  });
});
