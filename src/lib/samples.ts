import type { SoapNote } from "./soap";

/**
 * Synthetic visit transcripts (no real patients) used for the demo and tests.
 * Each includes a few identifiers on purpose so redaction has something to do.
 */
export type SampleVisit = {
  id: string;
  title: string;
  setting: string;
  patientName: string;
  transcript: string;
  /** Hand-written reference note used when no AI provider is configured. */
  note: SoapNote;
};

export const SAMPLE_VISITS: SampleVisit[] = [
  {
    id: "htn-followup",
    title: "Blood pressure & diabetes follow-up",
    setting: "Family medicine · 20 min",
    patientName: "Robert Hayes",
    transcript: `Doctor: Good morning, Mr. Hayes. I'm Dr. Patel. Can you confirm your date of birth for me?
Patient: Sure, it's 04/11/1961.
Doctor: Thanks. So we're following up on your blood pressure and sugars. How have things been since we started the lisinopril?
Patient: Pretty good. I've been taking the 10 milligrams every morning. Checking my pressure at home most days, it's usually around 135 over 85.
Doctor: Any dizziness, cough, swelling in your ankles?
Patient: A dry cough, maybe the last three weeks. Annoying more than anything. No dizziness.
Doctor: Okay. How about the metformin?
Patient: 500 twice a day with meals. Stomach was upset the first week but it's fine now.
Doctor: Good. Your A1c from last week came back at 7.4, down from 8.1. Today your blood pressure here is 138 over 86, pulse 72, weight 214 pounds.
Patient: Still not where you want it, I guess.
Doctor: It's moving the right way. Because of the cough, I'd like to switch you from lisinopril to losartan 50 milligrams once a day. The cough should settle within a few weeks.
Patient: That works.
Doctor: Keep the metformin as is. I'd also like you to cut back on salt and try for a 30-minute walk five days a week. We'll repeat a basic metabolic panel in two weeks to check your kidneys and potassium on the new medication.
Patient: Can you send the lab order to the place on 18 Willow Creek Road?
Doctor: Yes. And if the pharmacy needs to reach you, still 555-201-7788?
Patient: That's right.
Doctor: Great. Let's see you back in three months, sooner if your home readings are over 160.`,
    note: {
      chiefComplaint: "Follow-up of hypertension and type 2 diabetes; new dry cough.",
      subjective:
        "Taking lisinopril 10 mg daily; home BP readings around 135/85. Reports dry cough for about 3 weeks, no dizziness or ankle swelling. Taking metformin 500 mg twice daily with meals; initial GI upset has resolved.",
      objective: "BP 138/86, pulse 72, weight 214 lb. A1c 7.4% (previously 8.1%).",
      assessment:
        "Hypertension, not yet at goal, with dry cough likely ACE-inhibitor related. Type 2 diabetes with improving glycemic control.",
      plan: "Stop lisinopril; start losartan 50 mg daily. Continue metformin. Reduce dietary sodium and walk 30 minutes five days a week. Basic metabolic panel in 2 weeks to check renal function and potassium.",
      medications: [
        { name: "Lisinopril", dose: "10 mg", frequency: "once daily", status: "stopped" },
        { name: "Losartan", dose: "50 mg", frequency: "once daily", status: "new" },
        { name: "Metformin", dose: "500 mg", frequency: "twice daily with meals", status: "continued" },
      ],
      followUp: "Return in 3 months, or sooner if home BP readings exceed 160 systolic.",
      missingInfo: ["Allergies not reviewed", "Foot and eye exam status for diabetes not discussed"],
    },
  },
  {
    id: "peds-ear-pain",
    title: "Child with ear pain and fever",
    setting: "Pediatrics · 15 min",
    patientName: "Lily Chen",
    transcript: `Doctor: Hi there, and hi Mom. What brings Lily in today?
Parent: She's been pulling at her right ear since Sunday and had a fever last night, 102.3.
Doctor: How old is she now?
Parent: Four, she turned four in March.
Doctor: Any cough, runny nose, vomiting?
Parent: Runny nose last week. No vomiting. She's eating less but drinking okay.
Doctor: Any medicines so far?
Parent: Children's ibuprofen, about 7 and a half milliliters every 6 to 8 hours. It helps.
Doctor: Any allergies to medicines?
Parent: No.
Doctor: Okay, let's take a look. Temperature today is 100.9. Left ear looks normal. The right eardrum is red and bulging, which fits an ear infection. Throat is mildly red, lungs are clear.
Parent: Does she need antibiotics?
Doctor: With a bulging eardrum and fever over 102, yes, I'd treat it. Amoxicillin, the dose is based on her weight of 36 pounds, twice a day for 10 days. Keep the ibuprofen for pain and fever.
Parent: Okay.
Doctor: Call us if she isn't better in 48 to 72 hours, if the fever goes above 104, or if you notice swelling behind the ear. Otherwise I'd like to recheck the ear in about 3 weeks.`,
    note: {
      chiefComplaint: "Right ear pain and fever.",
      subjective:
        "4-year-old pulling at right ear since Sunday with fever to 102.3°F last night. Rhinorrhea last week. No vomiting; decreased appetite with adequate fluid intake. Ibuprofen 7.5 mL every 6–8 hours helps. No known drug allergies.",
      objective:
        "Temp 100.9°F. Weight 36 lb. Right tympanic membrane erythematous and bulging; left TM normal. Mild pharyngeal erythema. Lungs clear.",
      assessment: "Acute otitis media, right ear.",
      plan: "Amoxicillin, weight-based dosing, twice daily for 10 days. Continue ibuprofen for pain and fever. Return precautions reviewed: no improvement in 48–72 hours, fever above 104°F, or swelling behind the ear.",
      medications: [
        { name: "Amoxicillin", dose: "weight-based (36 lb)", frequency: "twice daily for 10 days", status: "new" },
        { name: "Ibuprofen (children's)", dose: "7.5 mL", frequency: "every 6–8 hours as needed", status: "continued" },
      ],
      followUp: "Ear recheck in about 3 weeks.",
      missingInfo: ["Exact amoxicillin dose in mg/kg not documented", "Immunization status not reviewed"],
    },
  },
  {
    id: "low-back-pain",
    title: "Acute low back pain after lifting",
    setting: "Urgent care · 12 min",
    patientName: "Daniel Okoro",
    transcript: `Doctor: I'm Dr. Nguyen. What happened?
Patient: My name is Daniel Okoro. I was moving a couch on Saturday and felt something pull in my lower back, left side.
Doctor: Does the pain go down your leg?
Patient: No, it stays in the back. Worse when I bend or get out of the car.
Doctor: Any numbness, tingling, weakness in your legs? Any trouble controlling your bladder or bowels?
Patient: No, nothing like that.
Doctor: Fever, weight loss, history of cancer?
Patient: No.
Doctor: What have you tried?
Patient: Heating pad and some Tylenol, two extra strength a couple of times a day.
Doctor: On exam, you're tender over the left lower back muscles. Straight leg raise is negative on both sides, strength and reflexes are normal, sensation is intact.
Patient: So nothing's broken?
Doctor: This looks like a muscle strain. No imaging needed right now. I'd add naproxen 500 milligrams twice a day with food for up to 10 days, keep using heat, and stay active with gentle walking rather than bed rest.
Patient: Can I go back to work? I do deliveries.
Doctor: Light duty for a week, no lifting over 20 pounds. I'll give you a note. If it's not improving in 2 weeks, we'll refer you to physical therapy.`,
    note: {
      chiefComplaint: "Left low back pain after lifting a couch.",
      subjective:
        "Onset Saturday while lifting. Pain localized to left low back without radiation; worse with bending and transfers. Denies leg numbness, tingling or weakness, and bowel or bladder changes. No fever, weight loss or cancer history. Using heat and acetaminophen extra strength 2 tablets a few times daily.",
      objective:
        "Tenderness over left lumbar paraspinal muscles. Straight leg raise negative bilaterally. Strength, reflexes and sensation normal in lower extremities.",
      assessment: "Acute lumbar muscle strain without red-flag features or radiculopathy.",
      plan: "No imaging indicated. Naproxen 500 mg twice daily with food for up to 10 days. Continue heat; stay active with gentle walking. Work note for light duty for 1 week, lifting limit 20 lb.",
      medications: [
        { name: "Naproxen", dose: "500 mg", frequency: "twice daily with food, up to 10 days", status: "new" },
        {
          name: "Acetaminophen extra strength",
          dose: "2 tablets",
          frequency: "a few times daily as needed",
          status: "continued",
        },
      ],
      followUp: "Refer to physical therapy if not improving within 2 weeks.",
      missingInfo: ["Vital signs not recorded", "NSAID contraindications (kidney disease, ulcers) not asked"],
    },
  },
];

export function getSample(id: string): SampleVisit | undefined {
  return SAMPLE_VISITS.find((sample) => sample.id === id);
}
