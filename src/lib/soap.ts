import { z } from "zod";

export const medicationSchema = z.object({
  name: z.string().describe("Drug name as spoken, e.g. lisinopril"),
  dose: z.string().describe("Strength and form if stated, otherwise empty string"),
  frequency: z.string().describe("How often, if stated, otherwise empty string"),
  status: z.enum(["new", "continued", "changed", "stopped"]),
});

/**
 * A SOAP note drafted from a visit transcript. Every field is plain text the
 * clinician can edit; nothing here is coded or billable.
 */
export const soapNoteSchema = z.object({
  chiefComplaint: z.string().describe("One short line in the patient's terms"),
  subjective: z.string().describe("History of present illness, relevant history and symptoms reported by the patient"),
  objective: z.string().describe("Vitals, exam findings and results actually mentioned; never invent values"),
  assessment: z.string().describe("Clinician's impression as discussed in the visit"),
  plan: z.string().describe("Orders, treatment, education and referrals agreed in the visit"),
  medications: z.array(medicationSchema),
  followUp: z.string().describe("When and why to return, or empty string if not discussed"),
  missingInfo: z
    .array(z.string())
    .describe("Things a complete note would usually include that the transcript did not cover"),
});

export type SoapNote = z.infer<typeof soapNoteSchema>;
export type Medication = z.infer<typeof medicationSchema>;

export const SOAP_SECTIONS = [
  { key: "subjective", label: "Subjective", hint: "History and symptoms in the patient's words" },
  { key: "objective", label: "Objective", hint: "Vitals, exam and results" },
  { key: "assessment", label: "Assessment", hint: "Clinical impression" },
  { key: "plan", label: "Plan", hint: "Treatment, orders and education" },
] as const satisfies readonly { key: keyof SoapNote; label: string; hint: string }[];

export type SoapSectionKey = (typeof SOAP_SECTIONS)[number]["key"];

export function emptySoapNote(): SoapNote {
  return {
    chiefComplaint: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    medications: [],
    followUp: "",
    missingInfo: [],
  };
}
