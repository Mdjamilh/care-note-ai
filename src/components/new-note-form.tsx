"use client";

import { InfoIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createDraftAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SampleVisit } from "@/lib/samples";
import { RedactionPreview } from "./redaction-preview";
import { SamplePicker } from "./sample-picker";

const MAX = 20_000;

export function NewNoteForm({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [patientName, setPatientName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isPending, startTransition] = useTransition();

  const applySample = (sample: SampleVisit) => {
    setSampleId(sample.id);
    setTitle(sample.title);
    setPatientName(sample.patientName);
    setTranscript(sample.transcript);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createDraftAction({ transcript, patientName, title });
      if (result.ok) {
        toast.success("Draft ready for review.");
        router.push(`/notes/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section aria-labelledby="samples-heading" className="space-y-3">
        <h2 id="samples-heading" className="text-sm font-medium">
          Start from a sample visit
        </h2>
        <SamplePicker selectedId={sampleId} onSelect={applySample} />
      </section>

      {demoMode && (
        <p className="border-warning/40 bg-warning/10 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
          <InfoIcon className="text-warning mt-0.5 size-4 shrink-0" />
          Demo mode: notes can be drafted for the sample visits. Connect an AI provider to draft from your own
          transcripts.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="title">Note title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Follow-up: hypertension"
            maxLength={120}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="patient-name">Patient name (optional)</Label>
          <Input
            id="patient-name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Used only to redact it, never stored"
            autoComplete="off"
            maxLength={100}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transcript">Visit transcript</Label>
          <Textarea
            id="transcript"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value.slice(0, MAX));
              setSampleId(null);
            }}
            placeholder={"Doctor: What brings you in today?\nPatient: ..."}
            className="min-h-72 flex-1 font-mono text-xs leading-relaxed"
          />
          <p className="text-muted-foreground text-right text-xs tabular-nums">
            {transcript.length.toLocaleString()}/{MAX.toLocaleString()}
          </p>
        </div>
        <RedactionPreview transcript={transcript} patientName={patientName} />
      </div>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {isPending && (
          <p className="text-muted-foreground text-sm" aria-live="polite">
            Drafting your note. This usually takes 10–30 seconds.
          </p>
        )}
        <Button type="submit" size="lg" disabled={isPending || transcript.trim().length < 80}>
          {isPending ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
          Draft SOAP note
        </Button>
      </div>
    </form>
  );
}
