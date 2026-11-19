"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowRight, CircleDot } from "lucide-react";
import Link from "next/link";

import { LeaveCalendar } from "@/components/leave-calendar";
import { LeavesTable } from "@/components/leaves-table";
import { Empty, PageHeader, Panel, PanelHeader } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL } from "@/lib/labels";
import { tasksFor, useWorkspace } from "@/lib/overview";
import { usePersona } from "@/lib/persona";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Overview() {
  const { me } = usePersona();
  const { rows, loading } = useWorkspace(me);
  if (!me) return null;

  const tasks = tasksFor(me, rows);
  const soon = new Date();
  soon.setDate(soon.getDate() + 60);
  const soonIso = soon.toISOString().slice(0, 10);
  const stats = [
    { label: "On leave now", value: rows.filter((r) => r.leave.status === "active").length },
    {
      label: "Starting in 60 days",
      value: rows.filter((r) => r.leave.status === "planning" && r.leave.starts_on <= soonIso).length,
    },
    {
      label: "Plans awaiting approval",
      value: rows.filter((r) => r.leave.assignments.some((a) => a.status === "proposed")).length,
    },
    {
      label: "Duties held by cover",
      value: rows
        .filter((r) => r.leave.status === "active")
        .reduce((n, r) => n + r.leave.assignments.filter((a) => a.cover_person_id).length, 0),
    },
  ];
  const held = rows.flatMap(({ leave }) =>
    leave.assignments
      .filter((a) => a.cover_person_id === me.id && leave.status !== "closed")
      .map((a) => ({ leave, duty: leave.duties.find((d) => d.id === a.duty_id) })),
  );
  const isOperator = me.role === "manager" || me.role === "hr";

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      <PageHeader
        title={`${greeting()}, ${me.name.replace(/^Dr\.\s*/, "").split(" ")[0]}`}
        description={`${ROLE_LABEL[me.role]} · ${me.job_title}`}
      />

      {isOperator && (
        <Panel>
          <dl className="grid grid-cols-2 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className="px-5 py-4">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
                  {loading ? <Skeleton className="h-7 w-8" /> : s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
        <Panel>
          <PanelHeader
            title={isOperator ? "Leave calendar" : "Your leave"}
            description={isOperator ? "Every planned leave in your team on one timeline." : undefined}
            actions={
              <Link href="/leaves" className="text-xs font-medium text-crimson hover:underline">
                All leaves
              </Link>
            }
          />
          {loading && !rows.length ? (
            <div className="grid gap-3 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : rows.length ? (
            isOperator ? (
              <LeaveCalendar rows={rows} />
            ) : (
              <LeavesTable rows={rows} />
            )
          ) : (
            <Empty title="No leaves yet">Leaves you manage, take or cover appear here.</Empty>
          )}
        </Panel>

        <Panel className="xl:self-start">
          <PanelHeader title="Needs your attention" />
          {loading && !tasks.length ? (
            <div className="grid gap-3 p-5">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : tasks.length === 0 ? (
            <Empty title="You're up to date">
              New tasks appear here when a plan, change or return needs you.
            </Empty>
          ) : (
            <ul className="divide-y">
              {tasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/leaves/${t.leaveId}`}
                    className="group flex gap-3 px-5 py-3.5 hover:bg-accent"
                  >
                    {t.tone === "crimson" ? (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-crimson" aria-hidden />
                    ) : (
                      <CircleDot className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={clsx(
                          "block text-[13px] font-medium",
                          t.tone === "crimson" && "text-crimson-ink",
                        )}
                      >
                        {t.title}
                      </span>
                      <span className="line-clamp-2 block text-xs text-muted-foreground">{t.detail}</span>
                    </span>
                    <ArrowRight
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {isOperator && rows.length > 0 && (
        <Panel>
          <PanelHeader title="Leaves" description="Where each leave stands on its bridge." />
          <LeavesTable rows={rows} />
        </Panel>
      )}

      {held.length > 0 && (
        <Panel>
          <PanelHeader
            title="Duties you are holding"
            description="Temporary. Each one ends by the return date."
          />
          <ul className="divide-y">
            {held.map(({ leave, duty }) => (
              <li
                key={`${leave.id}-${duty?.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <span className="text-[13px] font-medium">{duty?.title}</span>
                <span className="text-xs text-muted-foreground">
                  for {leave.employee.name} · {duty?.hours_per_week} h/wk
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
