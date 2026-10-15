"use client";

import {
  ClipboardCopyIcon,
  FileCheck2Icon,
  FileDownIcon,
  FileJsonIcon,
  FilePenLineIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { amendNoteAction, deleteNoteAction, finalizeNoteAction } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toFhirDocumentReference, toMarkdown } from "@/lib/export";
import { fromNoteDto, type NoteDto } from "@/lib/note-dto";

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "note";

export function NoteActions({ note }: { note: NoteDto }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const exportable = fromNoteDto(note);

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        after?.();
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });

  return (
    <div className="space-y-2">
      <h2 className="mb-3 text-sm font-medium">Export</h2>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={async () => {
          await navigator.clipboard.writeText(toMarkdown(exportable));
          toast.success("Copied as Markdown.");
        }}
      >
        <ClipboardCopyIcon /> Copy as Markdown
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => download(`${slug(note.title)}.md`, toMarkdown(exportable), "text/markdown")}
      >
        <FileDownIcon /> Download .md
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() =>
          download(
            `${slug(note.title)}.fhir.json`,
            JSON.stringify(toFhirDocumentReference(exportable), null, 2),
            "application/fhir+json",
          )
        }
      >
        <FileJsonIcon /> Download FHIR JSON
      </Button>

      <h2 className="mt-6 mb-3 text-sm font-medium">Review</h2>
      {note.status === "draft" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full justify-start" disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" /> : <FileCheck2Icon />} Finalize note
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalize this note?</AlertDialogTitle>
              <AlertDialogDescription>
                Confirm you have reviewed every section. Finalized notes are locked; later changes are made as an
                amendment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(() => finalizeNoteAction({ id: note.id }), "Note finalized.")}>
                I&apos;ve reviewed it, finalize
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await amendNoteAction({ id: note.id });
              if (result.ok) {
                toast.success("Amendment created as a new draft.");
                router.push(`/notes/${result.data.id}`);
              } else {
                toast.error(result.error);
              }
            })
          }
        >
          {isPending ? <Loader2Icon className="animate-spin" /> : <FilePenLineIcon />} Create amendment
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start"
            disabled={isPending}
          >
            <Trash2Icon /> Delete note
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              The note and its redacted transcript will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => startTransition(async () => void (await deleteNoteAction({ id: note.id })))}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
