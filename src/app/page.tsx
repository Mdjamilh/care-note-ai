import {
  ArrowRightIcon,
  FileCheck2Icon,
  FileJsonIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getGenerator } from "@/server/providers";

const FEATURES = [
  {
    icon: ShieldCheckIcon,
    title: "Redaction first",
    body: "Names, dates, phone numbers, addresses and record numbers are masked before anything is stored or sent to the model, and you see exactly what was removed.",
  },
  {
    icon: SparklesIcon,
    title: "Structured SOAP drafts",
    body: "The model fills a strict schema: subjective, objective, assessment, plan, medications with status, and follow-up. No free-form guessing.",
  },
  {
    icon: ListChecksIcon,
    title: "Gaps called out",
    body: "Anything a complete note usually includes but the visit didn't cover is listed for the clinician instead of being invented.",
  },
  {
    icon: FileCheck2Icon,
    title: "Review, then finalize",
    body: "Edit every section with autosave. Finalized notes are locked; changes after that are recorded as amendments.",
  },
  {
    icon: FileJsonIcon,
    title: "Interoperable export",
    body: "Copy as Markdown or download a FHIR R4 DocumentReference (LOINC 11506-3) for EHR import.",
  },
];

export default function HomePage() {
  const { provider } = getGenerator();

  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-3xl pt-6 text-center">
        <p className="bg-card text-muted-foreground mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
          <span
            className={provider.id === "demo" ? "bg-warning size-1.5 rounded-full" : "bg-success size-1.5 rounded-full"}
          />
          {provider.id === "demo" ? "Demo mode with sample visits" : `Drafting with ${provider.label}`}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          From visit conversation to SOAP note in seconds.
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
          CareNote drafts structured clinical notes from transcripts, with privacy guardrails and a clinician review
          step built in.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/new">
              Start a note <ArrowRightIcon />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/notes">View history</Link>
          </Button>
        </div>
      </section>

      <section aria-label="Features" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="bg-card rounded-xl border p-6">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <feature.icon className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold">{feature.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{feature.body}</p>
          </div>
        ))}
        <div className="flex flex-col justify-center rounded-xl border border-dashed p-6">
          <p className="text-muted-foreground text-sm">
            Built for review, not autopilot. Every draft is labelled as AI-generated and stays a draft until a clinician
            finalizes it.
          </p>
        </div>
      </section>
    </div>
  );
}
