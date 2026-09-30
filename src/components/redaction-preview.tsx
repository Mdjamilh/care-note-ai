"use client";

import { ShieldCheckIcon } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { redactPhi, type RedactionType } from "@/lib/redact";

const LABELS: Record<RedactionType, string> = {
  NAME: "names",
  DATE: "dates",
  PHONE: "phone numbers",
  EMAIL: "emails",
  SSN: "SSNs",
  MRN: "record numbers",
  ADDRESS: "addresses",
  ZIP: "ZIP codes",
  URL: "links",
  AGE: "ages over 89",
};

const TOKEN = /(\[[A-Z]+(?: \d+)?\])/g;
// Separate non-global regex: .test() on a /g regex keeps lastIndex between calls.
const IS_TOKEN = /^\[[A-Z]+(?: \d+)?\]$/;

/** Live, in-browser preview of exactly what will be stored and sent to the AI model. */
export function RedactionPreview({ transcript, patientName }: { transcript: string; patientName: string }) {
  const result = useMemo(
    () => redactPhi(transcript, { knownNames: patientName ? [patientName] : [] }),
    [transcript, patientName],
  );
  const counts = Object.entries(result.counts) as [RedactionType, number][];

  return (
    <section aria-labelledby="preview-heading" className="bg-card flex h-full flex-col rounded-xl border">
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <ShieldCheckIcon className="text-success size-4" />
        <h2 id="preview-heading" className="text-sm font-medium">
          What leaves your browser
        </h2>
        <div className="ml-auto flex flex-wrap gap-1.5" aria-live="polite">
          {counts.length === 0 ? (
            <span className="text-muted-foreground text-xs">No identifiers found yet</span>
          ) : (
            counts.map(([type, n]) => (
              <Badge key={type} variant="secondary" className="font-normal">
                {n} {LABELS[type]}
              </Badge>
            ))
          )}
        </div>
      </header>
      <div className="max-h-[28rem] min-h-48 flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {result.text ? (
          result.text.split(TOKEN).map((part, i) =>
            IS_TOKEN.test(part) ? (
              <mark key={i} className="bg-primary/15 text-primary rounded px-0.5">
                {part}
              </mark>
            ) : (
              <span key={i}>{part}</span>
            ),
          )
        ) : (
          <p className="text-muted-foreground font-sans text-sm">
            The redacted transcript appears here as you type. Names, dates, phone numbers, addresses and record numbers
            are replaced before the note is drafted.
          </p>
        )}
      </div>
    </section>
  );
}
