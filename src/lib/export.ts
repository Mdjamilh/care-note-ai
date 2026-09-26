import { SOAP_SECTIONS, type Medication, type SoapNote } from "./soap";

export type ExportableNote = {
  id: string;
  title: string;
  status: "draft" | "final";
  content: SoapNote;
  createdAt: Date;
  finalizedAt: Date | null;
};

const MED_STATUS: Record<Medication["status"], string> = {
  new: "New",
  continued: "Continued",
  changed: "Changed",
  stopped: "Stopped",
};

function medicationLine(med: Medication): string {
  const details = [med.dose, med.frequency].filter(Boolean).join(", ");
  return `- **${med.name}**${details ? ` ${details}` : ""} (${MED_STATUS[med.status]})`;
}

export function toMarkdown(note: ExportableNote): string {
  const { content } = note;
  const lines = [
    `# ${note.title}`,
    "",
    `_${note.status === "final" ? `Finalized ${note.finalizedAt?.toISOString().slice(0, 10)}` : "Draft, not yet reviewed"}_`,
    "",
  ];
  if (content.chiefComplaint) lines.push(`**Chief complaint:** ${content.chiefComplaint}`, "");

  for (const section of SOAP_SECTIONS) {
    lines.push(`## ${section.label}`, "", content[section.key] || "_Not documented._", "");
  }
  if (content.medications.length > 0) {
    lines.push("## Medications", "", ...content.medications.map(medicationLine), "");
  }
  if (content.followUp) lines.push("## Follow-up", "", content.followUp, "");
  if (content.missingInfo.length > 0) {
    lines.push("## Not covered in the visit", "", ...content.missingInfo.map((item) => `- ${item}`), "");
  }
  return lines.join("\n").trimEnd() + "\n";
}

/** Converts UTF-8 text to base64 in both Node and the browser. */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Wraps the note as a FHIR R4 DocumentReference with the Markdown inline,
 * typed with LOINC 11506-3 (Progress note).
 * https://hl7.org/fhir/R4/documentreference.html
 */
export function toFhirDocumentReference(note: ExportableNote) {
  return {
    resourceType: "DocumentReference",
    id: note.id,
    status: "current",
    docStatus: note.status === "final" ? "final" : "preliminary",
    type: {
      coding: [{ system: "http://loinc.org", code: "11506-3", display: "Progress note" }],
      text: "SOAP progress note",
    },
    description: note.title,
    date: (note.finalizedAt ?? note.createdAt).toISOString(),
    content: [
      {
        attachment: {
          contentType: "text/markdown; charset=utf-8",
          title: `${note.title}.md`,
          data: toBase64(toMarkdown(note)),
        },
      },
    ],
  };
}
