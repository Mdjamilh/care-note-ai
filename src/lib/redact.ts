/**
 * Pattern-based PHI redaction, run before a transcript is stored or sent to a
 * model. Inspired by the HIPAA Safe Harbor identifier list; it is a safety net,
 * not a guarantee, so the UI always shows the result for review.
 */

export type RedactionType = "NAME" | "DATE" | "PHONE" | "EMAIL" | "SSN" | "MRN" | "ADDRESS" | "ZIP" | "URL" | "AGE";

export type Redaction = {
  type: RedactionType;
  original: string;
  replacement: string;
  start: number;
  end: number;
};

export type RedactionResult = {
  text: string;
  redactions: Redaction[];
  counts: Partial<Record<RedactionType, number>>;
};

type Rule = { type: RedactionType; pattern: RegExp; group?: number };

const MONTHS =
  "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

const RULES: Rule[] = [
  { type: "EMAIL", pattern: /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g },
  { type: "URL", pattern: /\bhttps?:\/\/[^\s)]+/g },
  { type: "SSN", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  {
    type: "MRN",
    pattern: /\b(?:MRN|medical record(?: number)?|chart (?:number|no\.?))[:#\s]*([A-Z0-9-]{4,})\b/gi,
    group: 1,
  },
  { type: "PHONE", pattern: /(?<!\w)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g },
  {
    type: "ADDRESS",
    pattern:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct|Way|Place|Pl)\b\.?/g,
  },
  { type: "ZIP", pattern: /\b(?:[A-Z]{2}|zip(?: code)?:?)\s+(\d{5}(?:-\d{4})?)\b/gi, group: 1 },
  { type: "DATE", pattern: /\b\d{1,2}[/-]\d{1,2}[/-](?:\d{4}|\d{2})\b/g },
  { type: "DATE", pattern: /\b\d{4}-\d{2}-\d{2}\b/g },
  { type: "DATE", pattern: new RegExp(`\\b(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`, "g") },
  {
    type: "DATE",
    pattern: new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS})(?:,?\\s+\\d{4})?\\b`, "g"),
  },
  // Safe Harbor: ages over 89 must be aggregated.
  { type: "AGE", pattern: /\b(?:9\d|1[0-1]\d)(?=[- ]?(?:years?|yrs?|y\/o|yo)\b)/gi },
  { type: "NAME", pattern: /\b(?:Mr|Mrs|Ms|Miss|Mx|Dr)\.?\s+((?:[A-Z][a-z'-]+)(?:\s+[A-Z][a-z'-]+)?)/g, group: 1 },
  {
    type: "NAME",
    pattern: /\b(?:[Mm]y name is|[Nn]ame's|I'm|I am|[Tt]his is)\s+([A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)/g,
    group: 1,
  },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Words that look like names after "I'm"/"this is" but aren't. */
const NOT_NAMES = new Set([
  "Dr",
  "Mr",
  "Mrs",
  "Ms",
  "Miss",
  "Mx",
  "Doctor",
  "Here",
  "Fine",
  "Good",
  "Okay",
  "Sorry",
  "Not",
  "Just",
  "Still",
  "Really",
  "So",
]);

function findMatches(text: string, knownNames: string[]): Omit<Redaction, "replacement">[] {
  const matches: Omit<Redaction, "replacement">[] = [];

  for (const { type, pattern, group } of RULES) {
    for (const match of text.matchAll(pattern)) {
      const value = group ? match[group] : match[0];
      if (!value || match.index === undefined) continue;
      const start = match.index + match[0].indexOf(value);
      if (type === "NAME" && NOT_NAMES.has(value.split(/\s+/)[0])) continue;
      matches.push({ type, original: value, start, end: start + value.length });
    }
  }

  // Names the user told us about: redact full names and each part on its own.
  const parts = new Set<string>();
  for (const name of knownNames.map((n) => n.trim()).filter(Boolean)) {
    parts.add(name);
    for (const part of name.split(/\s+/)) if (part.length > 1) parts.add(part);
  }
  for (const part of [...parts].sort((a, b) => b.length - a.length)) {
    for (const match of text.matchAll(new RegExp(`\\b${escapeRegExp(part)}\\b`, "gi"))) {
      matches.push({ type: "NAME", original: match[0], start: match.index!, end: match.index! + match[0].length });
    }
  }

  return matches;
}

/** Keeps the earliest, then longest, match when spans overlap. */
function removeOverlaps<T extends { start: number; end: number }>(matches: T[]): T[] {
  const sorted = [...matches].sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: T[] = [];
  let lastEnd = -1;
  for (const match of sorted) {
    if (match.start >= lastEnd) {
      kept.push(match);
      lastEnd = match.end;
    }
  }
  return kept;
}

export function redactPhi(text: string, options: { knownNames?: string[] } = {}): RedactionResult {
  const matches = removeOverlaps(findMatches(text, options.knownNames ?? []));

  // The same value always gets the same token, so the model can still tell people apart.
  const tokens = new Map<string, string>();
  const perType = new Map<RedactionType, number>();
  const redactions: Redaction[] = matches.map((match) => {
    const key = `${match.type}:${match.original.toLowerCase()}`;
    let replacement = tokens.get(key);
    if (!replacement) {
      if (match.type === "AGE") {
        replacement = "90+";
      } else {
        const n = (perType.get(match.type) ?? 0) + 1;
        perType.set(match.type, n);
        replacement = match.type === "NAME" ? `[NAME ${n}]` : `[${match.type}]`;
      }
      tokens.set(key, replacement);
    }
    return { ...match, replacement };
  });

  let output = "";
  let cursor = 0;
  for (const r of redactions) {
    output += text.slice(cursor, r.start) + r.replacement;
    cursor = r.end;
  }
  output += text.slice(cursor);

  const counts: RedactionResult["counts"] = {};
  for (const r of redactions) counts[r.type] = (counts[r.type] ?? 0) + 1;

  return { text: output, redactions, counts };
}
