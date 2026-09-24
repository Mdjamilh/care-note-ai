export type NoteErrorCode = "NOT_FOUND" | "LOCKED";

/** An expected failure whose message is safe to show to users. */
export class NoteError extends Error {
  constructor(
    readonly code: NoteErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "NoteError";
  }
}
