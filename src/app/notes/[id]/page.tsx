import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { NoteActions } from "@/components/note-actions";
import { NoteEditor } from "@/components/note-editor";
import { NoteMeta } from "@/components/note-meta";
import { getDb } from "@/db";
import { toNoteDto } from "@/lib/note-dto";
import { getNote } from "@/server/notes";
import { getWorkspaceId } from "@/server/workspace";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  return getNote(await getDb(), await getWorkspaceId(), id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const note = await load((await params).id);
  return { title: note?.title ?? "Note not found" };
}

export default async function NotePage({ params }: Props) {
  const note = await load((await params).id);
  if (!note) notFound();
  const dto = toNoteDto(note);

  return (
    <>
      <Link
        href="/notes"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeftIcon className="size-4" /> All notes
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        {/* Keyed by id so navigating to an amendment remounts with fresh state. */}
        <NoteEditor key={dto.id} note={dto} />

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="bg-card rounded-xl border p-5">
            <NoteMeta note={dto} />
          </section>
          <section className="bg-card rounded-xl border p-5">
            <NoteActions note={dto} />
          </section>
          <details className="bg-card rounded-xl border p-5 text-sm">
            <summary className="cursor-pointer font-medium">Redacted transcript</summary>
            <p className="text-muted-foreground mt-3 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {dto.transcript}
            </p>
          </details>
        </aside>
      </div>
    </>
  );
}
