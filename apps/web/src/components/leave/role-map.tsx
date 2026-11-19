"use client";

import { Button, Card, ErrorNote, Eyebrow, Pill } from "@/components/ui";
import { api, type Duty, type LeaveDetail, type Person, unwrap } from "@/lib/api/client";
import { useLeaveAction } from "@/lib/leave";

const EVIDENCE: Record<Duty["evidence"], { label: string; tone: "leaf" | "gold" | "crimson" }> = {
  said: { label: "said", tone: "leaf" },
  documented: { label: "documented", tone: "gold" },
  suggested: { label: "suggested", tone: "crimson" },
};

export function RoleMap({ leave, me }: { leave: LeaveDetail; me: Person }) {
  const isEmployee = me.id === leave.employee.id;
  const patch = useLeaveAction(leave.id, me.id, (v: { id: string; confirmed: boolean }) =>
    unwrap(
      api.PATCH("/api/v1/duties/{duty_id}", {
        params: { path: { duty_id: v.id } },
        body: { confirmed: v.confirmed },
      }),
    ),
  );
  const remove = useLeaveAction(leave.id, me.id, (dutyId: string) =>
    unwrap(api.DELETE("/api/v1/duties/{duty_id}", { params: { path: { duty_id: dutyId } } })),
  );

  const totalHours = leave.duties.reduce((s, d) => s + d.hours_per_week, 0);
  const hidden = leave.duties.filter((d) => d.source === "interview").length;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Role Map</Eyebrow>
          <h2 className="mt-3 text-xl font-extrabold">
            Every duty, <span className="text-crimson">with its evidence.</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <Pill tone="neutral">{leave.duties.length} duties</Pill>
          <Pill tone="crimson">{hidden} not in the job description</Pill>
          <Pill tone="neutral">{totalHours.toFixed(1)} h a week</Pill>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {leave.duties.length === 0 && (
          <li className="py-6 text-sm text-muted">Duties appear here as the interview goes on.</li>
        )}
        {leave.duties.map((d) => (
          <li key={d.id} className="grid gap-1.5 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold">{d.title}</p>
              <Pill tone={EVIDENCE[d.evidence].tone}>{EVIDENCE[d.evidence].label}</Pill>
              {d.confirmed && <Pill tone="leaf">confirmed</Pill>}
              <span className="ml-auto text-xs font-semibold text-muted">
                {d.frequency.replace("_", " ")} · {d.hours_per_week} h/wk
              </span>
            </div>
            {d.quote && (
              <blockquote className="border-l-2 border-crimson pl-3 text-sm text-muted italic">
                &ldquo;{d.quote}&rdquo;
              </blockquote>
            )}
            {!d.quote && d.detail && <p className="text-sm text-muted">{d.detail}</p>}
            {d.flag && <p className="text-xs font-semibold text-crimson-deep">{d.flag}</p>}
            {isEmployee && !d.confirmed && (
              <div className="flex gap-2 pt-1">
                <Button
                  className="px-3 py-1.5 text-xs"
                  onClick={() => patch.mutate({ id: d.id, confirmed: true })}
                >
                  {d.evidence === "suggested" ? "Yes, I do this" : "Confirm"}
                </Button>
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => remove.mutate(d.id)}>
                  {d.evidence === "suggested" ? "No, I don't" : "Remove"}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <ErrorNote message={(patch.error ?? remove.error)?.message} />
    </Card>
  );
}
