import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { notes } from "@/db/schema";
import type { Database } from "@/db/types";
import { SAMPLE_VISITS } from "@/lib/samples";
import { createTestDb } from "@/test/db";
import { amendNote, createNote, deleteNote, finalizeNote, getNote, listNotes, updateNote } from "./notes";

const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE_ELSE = "22222222-2222-4222-8222-222222222222";

let db: Database;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  await db.delete(notes);
});

const create = (workspaceId: string, i = 0) =>
  createNote(db, workspaceId, {
    title: SAMPLE_VISITS[i].title,
    source: "demo",
    transcript: "[redacted transcript]",
    redactionCounts: { NAME: 2 },
    content: SAMPLE_VISITS[i].note,
  });

describe("notes repository", () => {
  it("keeps workspaces isolated for reads, updates and deletes", async () => {
    const mine = await create(ME);

    expect(await getNote(db, SOMEONE_ELSE, mine.id)).toBeNull();
    expect(await listNotes(db, SOMEONE_ELSE)).toHaveLength(0);
    await expect(updateNote(db, SOMEONE_ELSE, mine.id, { title: "x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deleteNote(db, SOMEONE_ELSE, mine.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await getNote(db, ME, mine.id)).not.toBeNull();
  });

  it("lists newest first and searches title and chief complaint", async () => {
    await create(ME, 0);
    await create(ME, 1);
    await create(ME, 2);

    expect((await listNotes(db, ME)).map((n) => n.title)).toEqual(SAMPLE_VISITS.map((s) => s.title).reverse());
    expect((await listNotes(db, ME, { q: "ear" })).map((n) => n.title)).toEqual(["Child with ear pain and fever"]);
    expect(await listNotes(db, ME, { q: "lifting a couch" })).toHaveLength(1);
    expect(await listNotes(db, ME, { q: "100%" })).toHaveLength(0);
  });

  it("updates drafts and bumps updatedAt", async () => {
    const note = await create(ME);
    const updated = await updateNote(db, ME, note.id, {
      title: "Edited",
      content: { ...note.content, plan: "New plan" },
    });
    expect(updated.title).toBe("Edited");
    expect(updated.content.plan).toBe("New plan");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(note.updatedAt.getTime());
  });

  it("locks finalized notes and supports amendments as new drafts", async () => {
    const note = await create(ME);
    const finalizedAt = new Date("2026-10-22T15:00:00Z");
    const final = await finalizeNote(db, ME, note.id, finalizedAt);
    expect(final).toMatchObject({ status: "final", finalizedAt });

    await expect(updateNote(db, ME, note.id, { title: "x" })).rejects.toMatchObject({ code: "LOCKED" });
    await expect(finalizeNote(db, ME, note.id)).rejects.toMatchObject({ code: "LOCKED" });

    const amendment = await amendNote(db, ME, note.id);
    expect(amendment).toMatchObject({ status: "draft", title: `${note.title} (amended)`, content: note.content });
    expect((await amendNote(db, ME, amendment.id)).title).toBe(`${note.title} (amended)`);
  });

  it("deletes notes", async () => {
    const note = await create(ME);
    await deleteNote(db, ME, note.id);
    expect(await getNote(db, ME, note.id)).toBeNull();
  });
});
