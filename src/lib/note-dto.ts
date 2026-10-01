import type { Note } from "@/db/schema";

/** Plain, serializable shape of a note for client components. */
export type NoteDto = Omit<Note, "workspaceId" | "createdAt" | "updatedAt" | "finalizedAt"> & {
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
};

export function toNoteDto(note: Note): NoteDto {
  // Never ship the workspace id to the browser.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { workspaceId, ...rest } = note;
  return {
    ...rest,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    finalizedAt: note.finalizedAt?.toISOString() ?? null,
  };
}

export function fromNoteDto(dto: NoteDto) {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    finalizedAt: dto.finalizedAt ? new Date(dto.finalizedAt) : null,
  };
}
