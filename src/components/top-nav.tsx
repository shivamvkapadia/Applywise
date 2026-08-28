"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/discover", label: "Find jobs" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();

  // No chrome on the lock screen.
  if (pathname === "/unlock") return null;

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 focus-ring rounded-md">
          <span className="h-4 w-4 rounded-sm bg-primary" aria-hidden />
          <span className="text-sm font-semibold tracking-tight text-ink">
            Applywise
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-ring",
                  active
                    ? "bg-surface-1 text-ink"
                    : "text-ink-subtle hover:text-ink hover:bg-surface-1"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
