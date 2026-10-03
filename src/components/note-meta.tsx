import { BotIcon, ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { NoteDto } from "@/lib/note-dto";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<NoteDto["source"], string> = {
  ai: "AI draft",
  demo: "Demo reference note",
  manual: "Written manually",
};

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

export function StatusBadge({ status }: { status: NoteDto["status"] }) {
  return (
    <Badge
      className={cn(status === "final" ? "bg-success/15 text-success" : "bg-warning/15 text-warning", "capitalize")}
    >
      {status === "final" ? "Final" : "Draft"}
    </Badge>
  );
}

export function NoteMeta({ note }: { note: NoteDto }) {
  const identifiers = Object.values(note.redactionCounts).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <dl className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <StatusBadge status={note.status} />
        </dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Source</dt>
        <dd className="inline-flex items-center gap-1.5">
          <BotIcon className="size-3.5" /> {SOURCE_LABEL[note.source]}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Created</dt>
        <dd className="text-right">{dateTime(note.createdAt)}</dd>
      </div>
      {note.finalizedAt && (
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Finalized</dt>
          <dd className="text-right">{dateTime(note.finalizedAt)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Identifiers removed</dt>
        <dd className="inline-flex items-center gap-1.5">
          <ShieldCheckIcon className="text-success size-3.5" /> {identifiers}
        </dd>
      </div>
    </dl>
  );
}
