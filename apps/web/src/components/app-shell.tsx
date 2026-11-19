"use client";

import clsx from "clsx";
import { CalendarRange, ChevronDown, LayoutDashboard, ScrollText, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { ROLE_LABEL } from "@/lib/labels";
import { usePersona } from "@/lib/persona";

import { ArchLogo } from "./arch-logo";
import { Avatar } from "./ui";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/leaves", label: "Leaves", icon: CalendarRange },
  { href: "/people", label: "People", icon: Users },
  { href: "/audit", label: "Audit log", icon: ScrollText },
];

function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// The current path is runtime data, so the nav that highlights it renders inside Suspense
// with an unhighlighted fallback.
function RailNavCurrent() {
  return <RailNav pathname={usePathname()} />;
}

function TabNavCurrent() {
  return <TabNav pathname={usePathname()} />;
}

function RailNav({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="grid gap-0.5 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors",
              active ? "bg-white text-crimson-ink" : "text-rail-text hover:bg-rail-hover hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function TabNav({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="flex gap-1 overflow-x-auto border-b border-line bg-panel px-4 lg:hidden"
    >
      {NAV.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={clsx(
            "border-b-2 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap",
            isActive(pathname, href) ? "border-crimson text-ink" : "border-transparent text-muted",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me } = usePersona();

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-rail text-rail-text lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 pt-5 pb-6" aria-label="Shetu overview">
          <ArchLogo onDark className="h-6 w-auto" />
          <span className="text-[17px] font-extrabold tracking-tight text-white">Shetu</span>
          <span className="font-bangla text-[17px] font-semibold text-rail-text/80">সেতু</span>
        </Link>
        <Suspense fallback={<RailNav pathname={null} />}>
          <RailNavCurrent />
        </Suspense>
        <div className="mt-auto border-t border-white/10 px-5 py-4 text-2xs text-rail-text/80">
          {me && (
            <div className="mb-3 flex items-center gap-2.5">
              <Avatar name={me.name} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{me.name}</p>
                <p className="truncate">{ROLE_LABEL[me.role]}</p>
              </div>
            </div>
          )}
          Demo workspace. All people and organizations are synthetic.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <Suspense fallback={<TabNav pathname={null} />}>
          <TabNavCurrent />
        </Suspense>
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function TopBar() {
  const { me, people, choose } = usePersona();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-sm sm:px-8">
      <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="Shetu overview">
        <ArchLogo className="h-5 w-auto" />
        <span className="font-extrabold">Shetu</span>
      </Link>
      <span className="ml-auto hidden items-center rounded-md border border-gold/40 bg-gold-soft px-2 py-1 text-2xs font-semibold text-gold-ink sm:inline-flex">
        Synthetic demo data
      </span>
      <label className="relative flex items-center gap-2 rounded-lg border border-line-strong bg-panel py-1 pr-8 pl-1.5 shadow-[0_1px_2px_rgba(34,32,35,.06)] hover:bg-sunk max-sm:ml-auto">
        <span className="sr-only">Viewing as</span>
        {me ? <Avatar name={me.name} size="sm" /> : <span className="size-6 rounded-full bg-sunk" />}
        <select
          value={me?.id ?? ""}
          onChange={(e) => choose(e.target.value || null)}
          className="max-w-[46vw] appearance-none bg-transparent text-[13px] font-semibold text-ink outline-none"
        >
          <option value="">Choose a persona</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {ROLE_LABEL[p.role]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted" aria-hidden />
      </label>
    </header>
  );
}
