"use client";

import clsx from "clsx";
import { useState } from "react";

import { Button, Card, ErrorNote, Eyebrow, Pill } from "@/components/ui";
import { api, type LeaveDetail, type Person, unwrap } from "@/lib/api/client";
import { formatDate, weeksBetween } from "@/lib/format";
import { useLeaveAction } from "@/lib/leave";

import { RulePanel } from "./rule-panel";

const HOURS = [0, 2, 4, 6, 8];

export function CoverPlan({ leave, me }: { leave: LeaveDetail; me: Person }) {
  const isManager = me.id === leave.manager.id;
  const [approved, setApproved] = useState<string | null>(null);
  const path = { params: { path: { leave_id: leave.id } } };

  const propose = useLeaveAction(leave.id, me.id, () =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/cover/propose", path)),
  );
  const approve = useLeaveAction(leave.id, me.id, () =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/cover/approve", path)),
  );
  const reassign = useLeaveAction(leave.id, me.id, (v: { id: string; person: string | null }) =>
    unwrap(
      api.PATCH("/api/v1/assignments/{assignment_id}", {
        params: { path: { assignment_id: v.id } },
        body: { cover_person_id: v.person },
      }),
    ),
  );
  const answer = useLeaveAction(leave.id, me.id, (v: { person: string; hours: number }) =>
    unwrap(
      api.PUT("/api/v1/leaves/{leave_id}/availability/{person_id}", {
        params: { path: { leave_id: leave.id, person_id: v.person } },
        body: { hours_per_week: v.hours },
      }),
    ),
  );

  const people = new Map(leave.team.map((p) => [p.id, p]));
  const avail = new Map(leave.availability.map((a) => [a.person_id, a]));
  const byDuty = new Map(leave.duties.map((d) => [d.id, d]));
  const load = new Map<string, number>();
  for (const a of leave.assignments) {
    if (a.cover_person_id)
      load.set(
        a.cover_person_id,
        (load.get(a.cover_person_id) ?? 0) + (byDuty.get(a.duty_id)?.hours_per_week ?? 0),
      );
  }
  const proposedPeople = Array.from(
    new Set(leave.assignments.map((a) => a.cover_person_id).filter((x): x is string => Boolean(x))),
  );
  const toAsk = proposedPeople.filter((p) => !avail.has(p));
  const weeks = weeksBetween(leave.starts_on, leave.ends_on);
  const planFindings = leave.findings.filter((f) => f.rule !== "R2" || !f.ok || leave.assignments.length > 0);
  const pending = leave.assignments.some((a) => a.status === "proposed");
  const busy = propose.isPending || approve.isPending || reassign.isPending || answer.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>Cover plan</Eyebrow>
            <h2 className="mt-3 text-xl font-extrabold">
              Every duty has an owner <span className="text-crimson">on every date.</span>
            </h2>
            <p className="mt-1 text-sm text-muted">
              {formatDate(leave.starts_on)} to {formatDate(leave.ends_on)} · {weeks} weeks. The AI proposes;
              the rules on the right decide whether it can be approved.
            </p>
          </div>
          {isManager && (
            <Button
              variant={leave.assignments.length ? "ghost" : "primary"}
              onClick={() => propose.mutate(undefined)}
              busy={propose.isPending}
              disabled={!leave.duties.length}
            >
              {leave.assignments.length ? "Propose again" : "Propose cover"}
            </Button>
          )}
        </div>

        {!leave.duties.length && (
          <p className="mt-6 text-sm text-muted">No duties yet. The employee builds the Role Map first.</p>
        )}

        {leave.assignments.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-muted">
                  <th className="pb-2">Duty</th>
                  <th className="pb-2">h/wk</th>
                  <th className="pb-2">Held by</th>
                  <th className="pb-2">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leave.assignments.map((a) => {
                  const duty = byDuty.get(a.duty_id);
                  return (
                    <tr key={a.id} className="align-top">
                      <td className="py-2.5 pr-3 font-semibold">{duty?.title}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{duty?.hours_per_week}</td>
                      <td className="py-2.5 pr-3">
                        {isManager ? (
                          <select
                            aria-label={`Cover for ${duty?.title}`}
                            value={a.cover_person_id ?? ""}
                            onChange={(e) => reassign.mutate({ id: a.id, person: e.target.value || null })}
                            className={clsx(
                              "rounded-md px-2 py-1 font-semibold ring-1",
                              a.cover_person_id ? "ring-line" : "bg-blush ring-crimson",
                            )}
                          >
                            <option value="">No owner</option>
                            {leave.team.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-semibold">
                            {people.get(a.cover_person_id ?? "")?.name ?? "No owner"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-muted">{a.rationale}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {proposedPeople.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold tracking-wide text-muted uppercase">Load against spare hours</p>
            <ul className="mt-2 grid gap-2">
              {proposedPeople.map((pid) => {
                const used = load.get(pid) ?? 0;
                const cap = avail.get(pid)?.hours_per_week;
                const over = cap !== undefined && used > cap;
                return (
                  <li key={pid} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
                    <span className="truncate font-semibold">{people.get(pid)?.name}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-sunk">
                      <span
                        className={clsx("block h-full rounded-full", over ? "bg-crimson" : "bg-leaf")}
                        style={{ width: `${Math.min(100, cap ? (used / Math.max(cap, used)) * 100 : 100)}%` }}
                      />
                    </span>
                    <span className={clsx("tabular-nums", over ? "font-bold text-crimson" : "text-muted")}>
                      {used} / {cap ?? "?"} h
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid content-start gap-6">
        {isManager && toAsk.length > 0 && (
          <Card className="ring-gold">
            <Eyebrow>One question each</Eyebrow>
            {toAsk.map((pid) => (
              <div key={pid} className="mt-3">
                <p className="text-sm font-bold">
                  About how many hours a week can {people.get(pid)?.name} spare for {weeks} weeks?
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {HOURS.map((h) => (
                    <Button
                      key={h}
                      variant="ghost"
                      className="px-3 py-1.5 text-xs"
                      disabled={busy}
                      onClick={() => answer.mutate({ person: pid, hours: h })}
                    >
                      {h === 8 ? "8+" : h} h
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}

        <Card>
          <Eyebrow>Rules check</Eyebrow>
          <div className="mt-3">
            <RulePanel findings={planFindings} />
          </div>
          {isManager && (
            <>
              <Button
                className="mt-4 w-full"
                disabled={!leave.can_approve || !pending}
                busy={approve.isPending}
                onClick={() =>
                  approve.mutate(undefined, {
                    onSuccess: () =>
                      setApproved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
                  })
                }
              >
                {pending || !leave.assignments.length
                  ? `Approve plan as ${me.name.split(" ")[0]}`
                  : "Plan approved"}
              </Button>
              {approved && (
                <p className="mt-2 text-sm font-semibold text-leaf">
                  Approved at {approved}. Written to the audit log.
                </p>
              )}
            </>
          )}
          {!isManager && (
            <p className="mt-3 text-xs text-muted">Only {leave.manager.name} can approve this plan.</p>
          )}
          <ErrorNote message={(propose.error ?? approve.error ?? reassign.error ?? answer.error)?.message} />
        </Card>
        {leave.assignments.length > 0 && !pending && (
          <Pill tone="leaf">
            Plan approved. Every assignment ends by the return date plus {leave.handback_days} days.
          </Pill>
        )}
      </div>
    </div>
  );
}
