"use client";

import { FileTextIcon } from "lucide-react";

import { SAMPLE_VISITS, type SampleVisit } from "@/lib/samples";
import { cn } from "@/lib/utils";

type Props = { selectedId: string | null; onSelect: (sample: SampleVisit) => void };

export function SamplePicker({ selectedId, onSelect }: Props) {
  return (
    <div role="group" aria-label="Sample visits" className="grid gap-3 sm:grid-cols-3">
      {SAMPLE_VISITS.map((sample) => {
        const selected = sample.id === selectedId;
        return (
          <button
            key={sample.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(sample)}
            className={cn(
              "bg-card hover:border-primary/50 hover:bg-accent focus-visible:ring-ring/50 flex items-start gap-3 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-[3px]",
              selected && "border-primary bg-primary/5",
            )}
          >
            <FileTextIcon
              className={cn("mt-0.5 size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")}
            />
            <span>
              <span className="block text-sm font-medium">{sample.title}</span>
              <span className="text-muted-foreground block text-xs">{sample.setting}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
