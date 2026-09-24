import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { notes, type NewNote, type Note } from "@/db/schema";
import type { Executor } from "@/db/types";
import type { SoapNote } from "@/lib/soap";
import { NoteError } from "./errors";

type CreateInput = Omit<NewNote, "id" | "workspaceId" | "status" | "createdAt" | "updatedAt" | "finalizedAt">;

export async function createNote(db: Executor, workspaceId: string, input: CreateInput): Promise<Note> {
  const [note] = await db
    .insert(notes)
    .values({ ...input, workspaceId })
    .returning();
  return note;
}

export async function listNotes(
  db: Executor,
  workspaceId: string,
  filters: { q?: string; status?: Note["status"] } = {},
): Promise<Note[]> {
  const q = filters.q?.trim();
  const pattern = `%${q?.replace(/[%_\\]/g, "\\$&")}%`;
  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.workspaceId, workspaceId),
        filters.status ? eq(notes.status, filters.status) : undefined,
        q ? or(ilike(notes.title, pattern), ilike(sql`${notes.content}->>'chiefComplaint'`, pattern)) : undefined,
      ),
    )
    .orderBy(desc(notes.updatedAt));
}

/** Returns null for missing notes and for notes in another workspace alike. */
export async function getNote(db: Executor, workspaceId: string, id: string): Promise<Note | null> {
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.workspaceId, workspaceId)));
  return note ?? null;
}

async function requireDraft(db: Executor, workspaceId: string, id: string): Promise<Note> {
  const note = await getNote(db, workspaceId, id);
  if (!note) throw new NoteError("NOT_FOUND", "Note not found.");
  if (note.status === "final") {
    throw new NoteError("LOCKED", "This note is finalized. Create an amendment to make changes.");
  }
  return note;
}

export async function updateNote(
  db: Executor,
  workspaceId: string,
  id: string,
  patch: { title?: string; content?: SoapNote },
): Promise<Note> {
  return db.transaction(async (tx) => {
    await requireDraft(tx, workspaceId, id);
    const [updated] = await tx
      .update(notes)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.workspaceId, workspaceId), eq(notes.status, "draft")))
      .returning();
    return updated;
  });
}

export async function finalizeNote(db: Executor, workspaceId: string, id: string, now = new Date()): Promise<Note> {
  return db.transaction(async (tx) => {
    await requireDraft(tx, workspaceId, id);
    const [finalized] = await tx
      .update(notes)
      .set({ status: "final", finalizedAt: now, updatedAt: now })
      .where(and(eq(notes.id, id), eq(notes.workspaceId, workspaceId)))
      .returning();
    return finalized;
  });
}

/** Finalized notes are never edited in place; an amendment is a new draft copy. */
export async function amendNote(db: Executor, workspaceId: string, id: string): Promise<Note> {
  const original = await getNote(db, workspaceId, id);
  if (!original) throw new NoteError("NOT_FOUND", "Note not found.");
  return createNote(db, workspaceId, {
    title: `${original.title.replace(/ \(amended\)$/, "")} (amended)`,
    source: original.source,
    transcript: original.transcript,
    redactionCounts: original.redactionCounts,
    content: original.content,
  });
}

export async function deleteNote(db: Executor, workspaceId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.workspaceId, workspaceId)))
    .returning({ id: notes.id });
  if (deleted.length === 0) throw new NoteError("NOT_FOUND", "Note not found.");
}
