import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatDate, weeksBetween } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import type { LeaveRow } from "@/lib/overview";
import { currentStageIndex } from "@/lib/stages";

import { StageDots } from "./stage-dots";
import { Avatar, Badge } from "./ui";

export function LeavesTable({ rows }: { rows: LeaveRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-2xs font-semibold text-muted">
            <th className="px-5 py-2.5 font-semibold">Employee</th>
            <th className="px-3 py-2.5 font-semibold">Leave</th>
            <th className="px-3 py-2.5 font-semibold">Progress</th>
            <th className="px-3 py-2.5 font-semibold">Now</th>
            <th className="px-3 py-2.5 font-semibold">Manager</th>
            <th className="w-10 px-3 py-2.5">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ leave: l, stages }) => {
            const now = stages[currentStageIndex(stages)];
            return (
              <tr key={l.id} className="group relative hover:bg-sunk/60">
                <td className="px-5 py-3">
                  <Link
                    href={`/leaves/${l.id}`}
                    className="flex items-center gap-3 after:absolute after:inset-0"
                  >
                    <Avatar name={l.employee.name} />
                    <span className="min-w-0">
                      <span className="block font-bold text-ink">{l.employee.name}</span>
                      <span className="block truncate text-xs text-muted">{l.employee.job_title}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <span className="block font-semibold">
                    {formatDate(l.starts_on)} – {formatDate(l.ends_on)}
                  </span>
                  <span className="text-xs text-muted">{weeksBetween(l.starts_on, l.ends_on)} weeks</span>
                </td>
                <td className="px-3 py-3">
                  <StageDots stages={stages} />
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2">
                    <Badge
                      tone={now.state === "blocked" ? "crimson" : l.status === "closed" ? "leaf" : "neutral"}
                    >
                      {l.status === "closed" ? STATUS_LABEL.closed : now.label}
                    </Badge>
                    <span
                      className={now.state === "blocked" ? "font-semibold text-crimson-ink" : "text-muted"}
                    >
                      {now.note}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-ink-2">{l.manager.name}</td>
                <td className="px-3 py-3 text-muted">
                  <ChevronRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
