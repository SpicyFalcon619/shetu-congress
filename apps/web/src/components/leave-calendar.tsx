"use client";

import clsx from "clsx";
import Link from "next/link";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import type { LeaveRow } from "@/lib/overview";

import { Avatar } from "./shared";

const DAY = 86_400_000;
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short" });

function toDate(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

/** Every leave on one shared timeline, from the earliest leave to the latest return, with today marked. */
export function LeaveCalendar({ rows }: { rows: LeaveRow[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = rows.reduce(
    (m, r) => (r.leave.starts_on < m ? r.leave.starts_on : m),
    today.toISOString().slice(0, 10),
  );
  const last = rows.reduce(
    (m, r) => (r.leave.ends_on > m ? r.leave.ends_on : m),
    today.toISOString().slice(0, 10),
  );
  const f = toDate(first);
  const l = toDate(last);
  // From the earliest leave (at most a year back) to the latest return (at least six months ahead).
  const back = Math.min(
    12,
    Math.max(2, (today.getFullYear() - f.getFullYear()) * 12 + today.getMonth() - f.getMonth()),
  );
  const ahead = Math.min(
    15,
    Math.max(6, (l.getFullYear() - today.getFullYear()) * 12 + l.getMonth() - today.getMonth() + 1),
  );
  const start = new Date(today.getFullYear(), today.getMonth() - back, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + ahead + 1, 1);
  const count = back + ahead + 1;
  const span = end.getTime() - start.getTime();
  const pos = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - start.getTime()) / span) * 100));
  const months = Array.from(
    { length: count },
    (_, i) => new Date(start.getFullYear(), start.getMonth() + i, 1),
  );
  const cols = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
  const sorted = [...rows].sort((a, b) => a.leave.starts_on.localeCompare(b.leave.starts_on));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[48rem]">
        <div className="grid grid-cols-[11rem_minmax(0,1fr)] border-b">
          <div />
          <div className="relative grid text-2xs font-medium text-muted-foreground" style={cols}>
            {months.map((m, i) => (
              <span
                key={m.toISOString()}
                className="overflow-visible border-l px-1.5 py-2 whitespace-nowrap first:border-l-0"
              >
                {(count <= 12 || m.getMonth() % 3 === 0) && monthFmt.format(m)}
                {m.getMonth() === 0 && ` ${m.getFullYear()}`}
              </span>
            ))}
          </div>
        </div>
        <ul>
          {sorted.map(({ leave: l }) => {
            const s = toDate(l.starts_on);
            const e = new Date(toDate(l.ends_on).getTime() + DAY);
            const left = pos(s);
            const width = Math.max(1.2, pos(e) - left);
            return (
              <li
                key={l.id}
                className="grid grid-cols-[11rem_minmax(0,1fr)] items-center border-b last:border-b-0"
              >
                <Link
                  href={`/leaves/${l.id}`}
                  className="flex min-w-0 items-center gap-2 px-4 py-2.5 text-[13px] font-medium hover:text-crimson"
                >
                  <Avatar name={l.employee.name} size="sm" />
                  <span className="truncate">{l.employee.name}</span>
                </Link>
                <div className="relative h-11">
                  <div className="absolute inset-0 grid" style={cols} aria-hidden>
                    {months.map((m) => (
                      <span
                        key={m.toISOString()}
                        className="border-l border-dashed border-border/70 first:border-l-0"
                      />
                    ))}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/leaves/${l.id}`}
                        className={clsx(
                          "absolute top-1/2 h-6 -translate-y-1/2 rounded-md px-2 text-2xs leading-6 font-medium whitespace-nowrap transition-[filter] hover:brightness-95",
                          l.status === "active" && "bg-crimson text-white",
                          l.status === "planning" && "border border-gold/50 bg-gold-soft text-gold-ink",
                          l.status === "returning" && "bg-rose text-crimson-deep",
                          l.status === "closed" && "bg-secondary text-muted-foreground",
                        )}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <span className="block overflow-hidden text-ellipsis">{STATUS_LABEL[l.status]}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      {l.employee.name}: {formatDate(l.starts_on)} – {formatDate(l.ends_on)}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="relative grid grid-cols-[11rem_minmax(0,1fr)]">
          <div />
          <div className="relative h-0">
            <span
              className="absolute bottom-0 w-px bg-crimson"
              style={{ left: `${pos(today)}%`, height: `${sorted.length * 44 + 33}px` }}
              aria-hidden
            >
              <span className="absolute -top-1 -left-[3px] size-[7px] rounded-full bg-crimson" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
