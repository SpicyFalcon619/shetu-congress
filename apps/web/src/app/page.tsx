"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowRight, CircleDot } from "lucide-react";
import Link from "next/link";

import { LeavesTable } from "@/components/leaves-table";
import { PersonaPicker } from "@/components/persona-picker";
import { Empty, PageHeader, Panel, PanelHeader } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/labels";
import { tasksFor, useWorkspace } from "@/lib/overview";
import { usePersona } from "@/lib/persona";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Overview() {
  const { me, ready } = usePersona();
  const { rows, loading } = useWorkspace(me);

  if (!ready) return null;
  if (!me) return <PersonaPicker />;

  const tasks = tasksFor(me, rows);
  const held = rows.flatMap(({ leave }) =>
    leave.assignments
      .filter((a) => a.cover_person_id === me.id)
      .map((a) => ({ leave, duty: leave.duties.find((d) => d.id === a.duty_id) })),
  );

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      <PageHeader
        title={`${greeting()}, ${me.name.replace(/^Dr\.\s*/, "").split(" ")[0]}`}
        description={`${ROLE_LABEL[me.role]} · ${me.organization}`}
      />

      <div className="grid gap-6 [&>*]:min-w-0">
        <Panel>
          <PanelHeader
            title="Needs your attention"
            description={tasks.length ? undefined : "Nothing waiting on you."}
          />
          {loading && !tasks.length ? (
            <p className="px-5 py-6 text-[13px] text-muted">Checking every leave…</p>
          ) : tasks.length === 0 ? (
            <Empty title="You're up to date">
              New tasks appear here when a plan, change or return needs you.
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {tasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/leaves/${t.leaveId}`}
                    className="group flex gap-3 px-5 py-3.5 hover:bg-sunk/60"
                  >
                    {t.tone === "crimson" ? (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-crimson" aria-hidden />
                    ) : (
                      <CircleDot className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={clsx(
                          "block text-[13px] font-semibold",
                          t.tone === "crimson" && "text-crimson-ink",
                        )}
                      >
                        {t.title}
                      </span>
                      <span className="block text-xs text-muted">{t.detail}</span>
                    </span>
                    <ArrowRight
                      className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid content-start gap-6 [&>*]:min-w-0">
          <Panel>
            <PanelHeader
              title={me.role === "employee" ? "Your leave" : "Leaves you are part of"}
              actions={
                <Link href="/leaves" className="text-xs font-semibold text-crimson hover:underline">
                  View all
                </Link>
              }
            />
            {rows.length ? (
              <LeavesTable rows={rows} />
            ) : (
              <Empty title={loading ? "Loading…" : "No leaves yet"}>
                {!loading && "Leaves you manage, take or cover appear here."}
              </Empty>
            )}
          </Panel>

          {held.length > 0 && (
            <Panel>
              <PanelHeader
                title="Duties you are holding"
                description="Temporary. Each one ends by the return date."
              />
              <ul className="divide-y divide-line">
                {held.map(({ leave, duty }) => (
                  <li
                    key={`${leave.id}-${duty?.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <span className="text-[13px] font-semibold">{duty?.title}</span>
                    <span className="text-xs text-muted">
                      for {leave.employee.name} · {duty?.hours_per_week} h/wk
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
