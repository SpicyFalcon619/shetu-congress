"use client";

import clsx from "clsx";
import { useState } from "react";

import { LeavesTable } from "@/components/leaves-table";
import { PersonaPicker } from "@/components/persona-picker";
import { Empty, PageHeader, Panel } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/labels";
import { useWorkspace } from "@/lib/overview";
import { usePersona } from "@/lib/persona";

const FILTERS = ["all", "planning", "active", "returning", "closed"] as const;

export default function LeavesPage() {
  const { me, ready } = usePersona();
  const { rows, loading } = useWorkspace(me);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  if (!ready) return null;
  if (!me) return <PersonaPicker />;

  const shown = rows.filter((r) => filter === "all" || r.leave.status === filter);
  return (
    <div className="grid gap-5 [&>*]:min-w-0">
      <PageHeader title="Leaves" description="Every planned leave you manage, take or cover." />
      <Panel>
        <div
          role="tablist"
          aria-label="Filter by status"
          className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-2"
        >
          {FILTERS.map((f) => {
            const count = f === "all" ? rows.length : rows.filter((r) => r.leave.status === f).length;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-[13px] font-semibold whitespace-nowrap",
                  filter === f ? "border-crimson text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {f === "all" ? "All" : STATUS_LABEL[f]}
                <span className="rounded bg-sunk px-1.5 text-2xs text-ink-2">{count}</span>
              </button>
            );
          })}
        </div>
        {shown.length ? (
          <LeavesTable rows={shown} />
        ) : (
          <Empty title={loading ? "Loading…" : "No leaves here"}>{!loading && "Try another filter."}</Empty>
        )}
      </Panel>
    </div>
  );
}
