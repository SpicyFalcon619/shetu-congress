"use client";

import Link from "next/link";

import { usePersona } from "@/lib/persona";

import { ArchLogo } from "./arch-logo";
import { SyntheticBanner } from "./ui";

const ROLE_LABEL: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  cover: "Cover colleague",
  hr: "HR",
};

export function SiteHeader() {
  const { me, people, choose } = usePersona();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <SyntheticBanner />
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Shetu home">
          <ArchLogo />
          <span className="text-lg font-extrabold tracking-tight">Shetu</span>
          <span className="font-bangla text-lg font-semibold text-crimson">সেতু</span>
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <label htmlFor="persona" className="hidden text-xs font-semibold text-muted sm:block">
            Viewing as
          </label>
          <select
            id="persona"
            value={me?.id ?? ""}
            onChange={(e) => choose(e.target.value || null)}
            className="max-w-[60vw] rounded-lg bg-card px-3 py-2 text-sm font-semibold ring-1 ring-line"
          >
            <option value="">Choose a persona</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {ROLE_LABEL[p.role] ?? p.role}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

export { ROLE_LABEL };
