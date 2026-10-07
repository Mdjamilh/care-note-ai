import { FilePlus2Icon, NotebookTextIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/note-meta";
import { NotesSearch } from "@/components/notes-search";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { cn } from "@/lib/utils";
import { listNotes } from "@/server/notes";
import { getWorkspaceId } from "@/server/workspace";

export const metadata: Metadata = { title: "History" };

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "final", label: "Final" },
] as const;

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function timeAgo(date: Date) {
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

export default async function NotesPage({ searchParams }: Props) {
  const { q, status: rawStatus } = await searchParams;
  const status = rawStatus === "draft" || rawStatus === "final" ? rawStatus : undefined;
  const notes = await listNotes(await getDb(), await getWorkspaceId(), { q, status });

  const newButton = (
    <Button asChild>
      <Link href="/new">
        <FilePlus2Icon /> New note
      </Link>
    </Button>
  );

  const hrefFor = (value?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("status", value);
    const query = params.toString();
    return query ? `/notes?${query}` : "/notes";
  };

  return (
    <>
      <PageHeader
        title="History"
        description="Notes are private to this browser. Only redacted transcripts are stored."
        actions={newButton}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <NotesSearch />
        <nav aria-label="Filter by status" className="bg-muted flex gap-1 rounded-lg p-1">
          {FILTERS.map((filter) => {
            const active = filter.value === status;
            return (
              <Link
                key={filter.label}
                href={hrefFor(filter.value)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active && "bg-background text-foreground shadow-sm",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {notes.length === 0 ? (
        q || status ? (
          <EmptyState icon={SearchXIcon} title="No matching notes" description="Try a different search or filter." />
        ) : (
          <EmptyState
            icon={NotebookTextIcon}
            title="No notes yet"
            description="Draft your first SOAP note from a visit transcript. The sample visits are a quick way to try it."
            action={newButton}
          />
        )
      ) : (
        <ul className="grid gap-3">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="bg-card hover:border-primary/50 focus-visible:ring-ring/50 flex flex-col gap-2 rounded-xl border p-5 transition-colors outline-none focus-visible:ring-[3px] sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{note.title}</span>
                    <StatusBadge status={note.status} />
                  </div>
                  <p className="text-muted-foreground mt-1 truncate text-sm">{note.content.chiefComplaint}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">Updated {timeAgo(note.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
