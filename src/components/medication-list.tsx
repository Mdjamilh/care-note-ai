import { PillIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Medication } from "@/lib/soap";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<Medication["status"], string> = {
  new: "bg-success/15 text-success",
  continued: "bg-muted text-muted-foreground",
  changed: "bg-warning/15 text-warning",
  stopped: "bg-destructive/10 text-destructive",
};

export function MedicationList({ medications }: { medications: Medication[] }) {
  if (medications.length === 0) {
    return <p className="text-muted-foreground text-sm">No medications were discussed.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {medications.map((med, i) => (
        <li key={`${med.name}-${i}`} className="flex items-center gap-3 px-3 py-2.5">
          <PillIcon className="text-muted-foreground size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium", med.status === "stopped" && "line-through opacity-70")}>
              {med.name}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {[med.dose, med.frequency].filter(Boolean).join(" · ") || "Dose not stated"}
            </p>
          </div>
          <Badge className={cn("capitalize", STATUS_STYLES[med.status])}>{med.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
