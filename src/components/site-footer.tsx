"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/unlock") return null; // no chrome on the lock screen

  return (
    <footer className="border-t border-hairline px-6 py-6">
      <p className="mx-auto max-w-[1280px] text-xs text-ink-subtle">
        Applywise · your job hunt, organized.
      </p>
    </footer>
  );
}
