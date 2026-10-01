import type { Metadata } from "next";

import { NewNoteForm } from "@/components/new-note-form";
import { PageHeader } from "@/components/page-header";
import { getGenerator } from "@/server/providers";

export const metadata: Metadata = { title: "New note" };

export default function NewNotePage() {
  const { provider } = getGenerator();

  return (
    <>
      <PageHeader
        title="New note"
        description="Paste a visit transcript or pick a sample. Identifiers are redacted before anything is stored or sent to the AI model."
      />
      <NewNoteForm demoMode={provider.id === "demo"} />
    </>
  );
}
