"use client";

import { AlertTriangleIcon, CheckIcon, CloudOffIcon, Loader2Icon, LockIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { updateNoteAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave, type SaveState } from "@/hooks/use-autosave";
import type { NoteDto } from "@/lib/note-dto";
import { SOAP_SECTIONS, type SoapNote } from "@/lib/soap";
import { MedicationList } from "./medication-list";

function SaveIndicator({ state, locked }: { state: SaveState; locked: boolean }) {
  if (locked) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <LockIcon className="size-3.5" /> Finalized, read-only
      </span>
    );
  }
  const content = {
    idle: null,
    dirty: <span className="text-muted-foreground">Unsaved changes</span>,
    saving: (
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <Loader2Icon className="size-3.5 animate-spin" /> Saving…
      </span>
    ),
    saved: (
      <span className="text-success inline-flex items-center gap-1.5">
        <CheckIcon className="size-3.5" /> Saved
      </span>
    ),
    error: (
      <span className="text-destructive inline-flex items-center gap-1.5">
        <CloudOffIcon className="size-3.5" /> Couldn&apos;t save, retrying on next edit
      </span>
    ),
  }[state];
  return (
    <span className="text-xs" aria-live="polite">
      {content}
    </span>
  );
}

export function NoteEditor({ note }: { note: NoteDto }) {
  const locked = note.status === "final";
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<SoapNote>(note.content);

  const save = useCallback(
    async (value: { title: string; content: SoapNote }) => {
      if (!value.title.trim()) return false;
      const result = await updateNoteAction({ id: note.id, ...value });
      return result.ok;
    },
    [note.id],
  );
  const saveState = useAutosave({ title, content }, save, { enabled: !locked });

  const set = <K extends keyof SoapNote>(key: K, value: SoapNote[K]) =>
    setContent((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor="note-title" className="sr-only">
          Title
        </Label>
        <Input
          id="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          readOnly={locked}
          maxLength={120}
          className="focus-visible:border-input h-auto border-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:px-3 sm:text-3xl md:text-3xl dark:bg-transparent"
        />
        <SaveIndicator state={saveState} locked={locked} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="chief-complaint">Chief complaint</Label>
        <Input
          id="chief-complaint"
          value={content.chiefComplaint}
          onChange={(e) => set("chiefComplaint", e.target.value)}
          readOnly={locked}
        />
      </div>

      {content.missingInfo.length > 0 && (
        <aside
          aria-labelledby="missing-heading"
          className="border-warning/40 bg-warning/10 rounded-xl border p-4 text-sm"
        >
          <h2 id="missing-heading" className="mb-2 flex items-center gap-2 font-medium">
            <AlertTriangleIcon className="text-warning size-4" /> Not covered in the visit
          </h2>
          <ul className="text-muted-foreground list-disc space-y-1 pl-6">
            {content.missingInfo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      )}

      {SOAP_SECTIONS.map((section) => (
        <div key={section.key} className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={`section-${section.key}`} className="text-base font-semibold">
              {section.label}
            </Label>
            <span className="text-muted-foreground text-xs">{section.hint}</span>
          </div>
          <Textarea
            id={`section-${section.key}`}
            value={content[section.key]}
            onChange={(e) => set(section.key, e.target.value)}
            readOnly={locked}
            className="field-sizing-content min-h-24 leading-relaxed"
          />
        </div>
      ))}

      <div className="grid gap-2">
        <h2 className="text-base font-semibold">Medications</h2>
        <MedicationList medications={content.medications} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="follow-up" className="text-base font-semibold">
          Follow-up
        </Label>
        <Textarea
          id="follow-up"
          value={content.followUp}
          onChange={(e) => set("followUp", e.target.value)}
          readOnly={locked}
          className="field-sizing-content min-h-16"
        />
      </div>
    </div>
  );
}
