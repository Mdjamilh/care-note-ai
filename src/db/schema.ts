import { sql } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { RedactionResult } from "@/lib/redact";
import type { SoapNote } from "@/lib/soap";

export const noteStatus = pgEnum("note_status", ["draft", "final"]);
export const noteSource = pgEnum("note_source", ["ai", "demo", "manual"]);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Anonymous per-browser workspace; every query is scoped by it. */
    workspaceId: uuid("workspace_id").notNull(),
    title: text("title").notNull(),
    status: noteStatus("status").notNull().default("draft"),
    source: noteSource("source").notNull(),
    /** Only the redacted transcript is ever persisted. */
    transcript: text("transcript").notNull(),
    redactionCounts: jsonb("redaction_counts").$type<RedactionResult["counts"]>().notNull().default({}),
    content: jsonb("content").$type<SoapNote>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  },
  (t) => [
    index("notes_workspace_updated_idx").on(t.workspaceId, t.updatedAt.desc()),
    index("notes_title_search_idx").using("gin", sql`to_tsvector('english', ${t.title})`),
  ],
);

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
