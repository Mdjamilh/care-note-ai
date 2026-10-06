"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

export function NotesSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  // Debounce typing so we don't query on every keystroke.
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const timeout = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query.trim()) next.set("q", query.trim());
      else next.delete("q");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, params, pathname, router]);

  return (
    <div className="relative flex-1">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by title or chief complaint"
        aria-label="Search notes"
        className="pl-9"
      />
    </div>
  );
}
