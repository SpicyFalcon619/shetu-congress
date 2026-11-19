"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";

import { ChangesPanel } from "./changes-panel";
import { CoverPlan } from "./cover-plan";
import { Interview } from "./interview";
import { ReturnCheck } from "./return-check";
import { RoleMap } from "./role-map";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { formatDate, weeksBetween } from "@/lib/format";
import { useLeave } from "@/lib/leave";
import { usePersona } from "@/lib/persona";

const TABS = [
  { id: "map", label: "Before leave", sub: "Map her job" },
  { id: "cover", label: "Cover plan", sub: "Hold her role" },
  { id: "during", label: "During leave", sub: "Report changes" },
  { id: "return", label: "At return", sub: "Guard her return" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function LeaveView({ id }: { id: string }) {
  const { me, ready } = usePersona();
  const leave = useLeave(id, me?.id);
  const isManager = me?.id === leave.data?.manager.id;
  const [tab, setTab] = useState<Tab | null>(null);
  const active: Tab = tab ?? (isManager ? "cover" : "map");

  if (ready && !me) {
    return (
      <Card>
        <p className="font-bold">Choose a persona in the top bar to open this leave.</p>
      </Card>
    );
  }
  if (leave.isError) {
    return (
      <Card>
        <p className="font-bold text-crimson-deep">{leave.error.message}</p>
        <Link href="/" className="mt-3 inline-block text-sm font-bold text-crimson underline">
          Back to your leaves
        </Link>
      </Card>
    );
  }
  if (!leave.data || !me) return <p className="text-muted">Loading the leave…</p>;

  const l = leave.data;
  return (
    <div className="grid gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{l.employee.organization}</Eyebrow>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {l.employee.name}&rsquo;s leave, <span className="text-crimson">held together.</span>
          </h1>
          <p className="mt-2 text-muted">
            {l.employee.job_title} · {formatDate(l.starts_on)} to {formatDate(l.ends_on)} ·{" "}
            {weeksBetween(l.starts_on, l.ends_on)} weeks · manager {l.manager.name}
          </p>
        </div>
        <Pill tone={l.status === "closed" ? "leaf" : "crimson"}>{l.status}</Pill>
      </section>

      <nav aria-label="Stages" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={active === t.id ? "step" : undefined}
            className={clsx(
              "rounded-xl px-4 py-3 text-left ring-1 transition",
              active === t.id ? "bg-crimson text-white ring-crimson" : "bg-card ring-line hover:ring-crimson",
            )}
          >
            <span className="block text-sm font-extrabold">{t.label}</span>
            <span className={clsx("text-xs", active === t.id ? "text-blush" : "text-muted")}>{t.sub}</span>
          </button>
        ))}
      </nav>

      {active === "map" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Interview leave={l} me={me} />
          <RoleMap leave={l} me={me} />
        </div>
      )}
      {active === "cover" && <CoverPlan leave={l} me={me} />}
      {active === "during" && <ChangesPanel leave={l} me={me} />}
      {active === "return" && <ReturnCheck leave={l} me={me} />}
    </div>
  );
}
