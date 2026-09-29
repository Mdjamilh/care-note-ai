"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { soapNoteSchema } from "@/lib/soap";
import { NoteError } from "@/server/errors";
import { draftNote, GenerationError } from "@/server/generate";
import { amendNote, createNote, deleteNote, finalizeNote, updateNote } from "@/server/notes";
import { getGenerator } from "@/server/providers";
import { createRateLimiter } from "@/server/rate-limit";
import { getWorkspaceId } from "@/server/workspace";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const draftLimiter = createRateLimiter({ limit: 6, windowMs: 60_000 });

function failure(error: unknown): { ok: false; error: string } {
  if (error instanceof NoteError || error instanceof GenerationError) return { ok: false, error: error.message };
  console.error(error);
  return { ok: false, error: "Something went wrong on our side. Please try again." };
}

const createSchema = z.object({
  transcript: z
    .string()
    .trim()
    .min(80, "The transcript is too short to draft a note (at least 80 characters).")
    .max(20_000, "The transcript is too long. Keep it under 20,000 characters."),
  patientName: z.string().trim().max(100).optional(),
  title: z.string().trim().max(120).optional(),
});

export async function createDraftAction(input: z.input<typeof createSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = draftLimiter(ip);
  if (!limit.allowed) {
    return {
      ok: false,
      error: `Too many drafts in a short time. Try again in ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
    };
  }

  try {
    const { generator } = getGenerator();
    const { transcript, patientName, title } = parsed.data;
    const result = await draftNote(transcript, { knownNames: patientName ? [patientName] : [], generator });

    const db = await getDb();
    const note = await createNote(db, await getWorkspaceId(), {
      title: title || result.note.chiefComplaint.slice(0, 80) || "Untitled visit",
      source: result.source,
      // Persist only the redacted text; the raw transcript and patient name are discarded here.
      transcript: result.redaction.text,
      redactionCounts: result.redaction.counts,
      content: result.note,
    });
    revalidatePath("/notes");
    return { ok: true, data: { id: note.id } };
  } catch (error) {
    return failure(error);
  }
}

const updateSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Give the note a title.").max(120).optional(),
  content: soapNoteSchema.optional(),
});

export async function updateNoteAction(
  input: z.input<typeof updateSchema>,
): Promise<ActionResult<{ savedAt: string }>> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    const { id, ...patch } = parsed.data;
    const note = await updateNote(await getDb(), await getWorkspaceId(), id, patch);
    revalidatePath("/notes");
    return { ok: true, data: { savedAt: note.updatedAt.toISOString() } };
  } catch (error) {
    return failure(error);
  }
}

const idSchema = z.object({ id: z.uuid() });

export async function finalizeNoteAction(input: z.input<typeof idSchema>): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid note." };
  try {
    await finalizeNote(await getDb(), await getWorkspaceId(), parsed.data.id);
    revalidatePath("/notes", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function amendNoteAction(input: z.input<typeof idSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid note." };
  try {
    const amendment = await amendNote(await getDb(), await getWorkspaceId(), parsed.data.id);
    revalidatePath("/notes");
    return { ok: true, data: { id: amendment.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteNoteAction(input: z.input<typeof idSchema>): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid note." };
  try {
    await deleteNote(await getDb(), await getWorkspaceId(), parsed.data.id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/notes");
  redirect("/notes");
}
