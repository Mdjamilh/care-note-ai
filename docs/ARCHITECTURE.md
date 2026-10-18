# Architecture

CareNote is a single Next.js application. Pages are React Server Components, mutations are Server Actions, and a middleware assigns each browser an anonymous workspace.

```
src/
  middleware.ts      sets the carenote_ws cookie on first visit
  app/               pages + actions.ts (the only entry point for writes)
  components/        UI (ui/ holds shadcn primitives)
  hooks/             use-autosave
  lib/               pure code shared by server and browser
    redact.ts          PHI redaction
    soap.ts            SOAP note Zod schema
    export.ts          Markdown + FHIR DocumentReference
    samples.ts         synthetic visits with reference notes
  server/            server-only logic
    generate.ts        redact-then-draft pipeline, demo generator
    claude.ts          Claude generator (structured output)
    providers.ts       Claude or demo, from the environment
    notes.ts           repository with workspace scoping
  db/                Drizzle schema, client, PGlite fallback
```

## Privacy model

1. **Redaction runs twice, by design.** In the browser for the live preview, and again on the server, because the server never trusts what the client says was redacted. Redaction is idempotent: placeholders don't match any pattern.
2. **Only redacted text crosses the trust boundary.** `draftNote()` redacts before calling the generator, and a test asserts the generator never sees the original identifiers.
3. **Only redacted text is stored.** `createDraftAction` persists `result.redaction.text`; the raw transcript and patient name are dropped when the request ends.
4. **Workspace scoping.** Every query filters by `workspace_id`, and a note from another workspace returns "not found" rather than "forbidden", so its existence isn't revealed. The workspace id is never sent to the browser (see `toNoteDto`).

## Redaction

`redactPhi()` runs a list of regex rules (email, URL, SSN, MRN, phone, address, ZIP, several date formats, ages over 89, names after honorifics or self-introductions) plus any names the user supplies. Matches are de-overlapped (earliest, then longest, wins) and replaced right to left in one pass. Equal values share a placeholder (`[NAME 1]` stays `[NAME 1]`), so the model can still follow who said what.

## Drafting

`NoteGenerator` is a small interface: `{ source, generate(redactedText) }`.

- **Claude** (`claude.ts`) calls `beta.messages.parse` with `betaZodOutputFormat(soapNoteSchema)`, medium effort, and `fallbacks: "default"` so that a safety-classifier decline is retried server-side. Refusals and truncated output become user-facing `GenerationError`s.
- **Demo** (`generate.ts`) recognises the sample transcripts after redaction and whitespace normalisation, and returns their reference notes.

Whatever the generator returns is parsed with Zod again before it's saved.

## Notes lifecycle

```
draft ──edit (autosave)──► draft ──finalize──► final (locked)
                                                 │
                                                 └──amend──► new draft "(amended)"
```

`updateNote` and `finalizeNote` re-check the status inside a transaction, so a finalized note can't be modified by a stale tab.

## Data model

One table, `notes`: `id`, `workspace_id`, `title`, `status` (`draft`/`final`), `source` (`ai`/`demo`/`manual`), `transcript` (redacted), `redaction_counts` (JSONB), `content` (JSONB SOAP note), timestamps. Indexed on `(workspace_id, updated_at DESC)` for the history list, plus a GIN full-text index on the title.

## Testing

| Level | Tool | Covers |
|---|---|---|
| Unit | Vitest | redaction rules, sample integrity, exports, rate limiter |
| Integration | Vitest + PGlite | pipeline guarantees, repository isolation and locking |
| End-to-end | Playwright | full user journeys on desktop and Pixel 7, in demo mode against an in-memory database |
