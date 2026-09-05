import { NotebookPenIcon } from "lucide-react";
import Link from "next/link";

import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/new", label: "New note" },
  { href: "/notes", label: "History" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NotebookPenIcon className="size-4" />
          </span>
          <span className="hidden sm:inline">CareNote</span>
        </Link>
        <NavLinks items={NAV} />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
