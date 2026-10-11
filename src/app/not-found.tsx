import { CompassIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10">
      <EmptyState
        icon={CompassIcon}
        title="Note not found"
        description="It may have been deleted, or it belongs to a different browser. Notes are private to the browser that created them."
        action={
          <Button asChild>
            <Link href="/notes">Back to history</Link>
          </Button>
        }
      />
    </div>
  );
}
