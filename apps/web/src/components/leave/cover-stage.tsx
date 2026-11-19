"use client";

import clsx from "clsx";
import { RefreshCw, Wand2 } from "lucide-react";
import { useState } from "react";

import { Avatar, Badge, Button, Empty, ErrorNote, Panel, PanelHeader } from "@/components/shared";
import { api, type LeaveDetail, type Person, unwrap } from "@/lib/api/client";
import { weeksBetween } from "@/lib/format";
import { useLeaveAction } from "@/lib/leave";

import { PersonSelect } from "@/components/person-select";

import { RulesInspector } from "./rules-inspector";

const HOURS = [0, 2, 4, 6, 8];
const COVER_RULES = ["R2", "R3", "R4", "R5", "R6", "R7"];

export function CoverStage({ leave, me }: { leave: LeaveDetail; me: Person }) {
  const isManager = me.id === leave.manager.id;
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
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
  const avail = new Map(leave.availability.map((a) => [a.person_id, a.hours_per_week]));
  const duties = new Map(leave.duties.map((d) => [d.id, d]));
  const load = new Map<string, number>();
  for (const a of leave.assignments) {
    if (a.cover_person_id)
      load.set(
        a.cover_person_id,
        (load.get(a.cover_person_id) ?? 0) + (duties.get(a.duty_id)?.hours_per_week ?? 0),
      );
  }
  const hoursMap = new Map(
    leave.team.map((p) => [p.id, { used: load.get(p.id) ?? 0, cap: avail.get(p.id) }]),
  );
  const coverPeople = [
    ...new Set(leave.assignments.map((a) => a.cover_person_id).filter(Boolean)),
  ] as string[];
  const toAsk = coverPeople.filter((p) => !avail.has(p));
  const weeks = weeksBetween(leave.starts_on, leave.ends_on);
  const pending = leave.assignments.some((a) => a.status === "proposed");
  const findings = leave.findings.filter((f) => COVER_RULES.includes(f.rule));
  const hasPlan = leave.assignments.length > 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
      <div className="grid content-start gap-5">
        <Panel>
          <PanelHeader
            title="Cover plan"
            description={`One owner for every duty, every day of the ${weeks}-week leave. The AI proposes; the rules decide whether it can be approved.`}
            actions={
              isManager && (
                <Button
                  variant={hasPlan ? "secondary" : "primary"}
                  onClick={() => propose.mutate(undefined)}
                  busy={propose.isPending}
                  disabled={!leave.duties.length}
                >
                  {hasPlan ? (
                    <RefreshCw className="size-3.5" aria-hidden />
                  ) : (
                    <Wand2 className="size-3.5" aria-hidden />
                  )}
                  {hasPlan ? "Propose again" : "Propose cover"}
                </Button>
              )
            }
          />
          {!leave.duties.length ? (
            <Empty title="Waiting for the Role Map">
              {leave.employee.name.split(" ")[0]} maps her job first. Then Shetu can propose cover.
            </Empty>
          ) : !hasPlan ? (
            <Empty title="No plan yet">
              {isManager
                ? "Propose cover and Shetu suggests a colleague for each duty, with a reason. You stay in control of every assignment."
                : `${leave.manager.name} has not proposed a plan yet.`}
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-2xs font-semibold text-muted-foreground">
                    <th className="px-5 py-2.5 font-semibold">Duty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">h/wk</th>
                    <th className="px-3 py-2.5 font-semibold">Held by</th>
                    <th className="px-5 py-2.5 font-semibold">Why this person</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {leave.assignments.map((a) => {
                    const duty = duties.get(a.duty_id);
                    const over =
                      a.cover_person_id !== null &&
                      avail.has(a.cover_person_id) &&
                      (load.get(a.cover_person_id) ?? 0) > (avail.get(a.cover_person_id) ?? 0);
                    return (
                      <tr key={a.id} className={clsx("align-top", !a.cover_person_id && "bg-blush/50")}>
                        <td className="px-5 py-3 font-semibold">{duty?.title}</td>
                        <td className="px-3 py-3 text-right">{duty?.hours_per_week}</td>
                        <td className="px-3 py-2.5">
                          {isManager ? (
                            <PersonSelect
                              label={`Cover for ${duty?.title}`}
                              value={a.cover_person_id}
                              people={leave.team}
                              invalid={!a.cover_person_id || over}
                              hours={hoursMap}
                              onChange={(person) => reassign.mutate({ id: a.id, person })}
                            />
                          ) : (
                            <span className="font-semibold">
                              {people.get(a.cover_person_id ?? "")?.name ?? "No owner"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs leading-relaxed text-muted-foreground">
                          {a.rationale}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {coverPeople.length > 0 && (
          <Panel>
            <PanelHeader
              title="Load against spare hours"
              description="Each person's weekly cover hours, checked every week of the leave (R4)."
            />
            <ul className="divide-y divide-line">
              {coverPeople.map((pid) => {
                const used = load.get(pid) ?? 0;
                const cap = avail.get(pid);
                const over = cap !== undefined && used > cap;
                const scale = Math.max(cap ?? 0, used, 8);
                return (
                  <li
                    key={pid}
                    className="grid grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)_5.5rem] items-center gap-4 px-5 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={people.get(pid)?.name ?? pid} size="sm" />
                      <span className="truncate text-[13px] font-semibold">{people.get(pid)?.name}</span>
                    </span>
                    <span className="relative h-2.5 rounded-full bg-sunk" aria-hidden>
                      <span
                        className={clsx(
                          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out-expo",
                          over ? "bg-crimson" : "bg-leaf",
                        )}
                        style={{ width: `${(used / scale) * 100}%` }}
                      />
                      {cap !== undefined && (
                        <span
                          className="absolute -inset-y-1 w-0.5 rounded bg-ink"
                          style={{ left: `calc(${(cap / scale) * 100}% - 1px)` }}
                        />
                      )}
                    </span>
                    <span
                      className={clsx(
                        "text-right text-[13px]",
                        over ? "font-bold text-crimson-ink" : "text-ink-2",
                      )}
                    >
                      {used} / {cap ?? "?"} h
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </div>

      <div className="grid content-start gap-5">
        {isManager && toAsk.length > 0 && (
          <Panel className="border-gold/60">
            <header className="border-b border-line bg-gold-soft/60 px-4 py-3">
              <h2 className="text-[13px] font-bold text-gold-ink">
                {toAsk.length === 1 ? "One question" : `${toAsk.length} questions`} before you approve
              </h2>
            </header>
            <div className="grid gap-4 p-4">
              {toAsk.map((pid) => (
                <fieldset key={pid}>
                  <legend className="text-[13px] font-semibold">
                    How many hours a week can {people.get(pid)?.name} spare for {weeks} weeks?
                  </legend>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {HOURS.map((h) => (
                      <Button
                        key={h}
                        size="sm"
                        variant="secondary"
                        disabled={answer.isPending}
                        onClick={() => answer.mutate({ person: pid, hours: h })}
                      >
                        {h === 8 ? "8+" : h} h
                      </Button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </Panel>
        )}

        <RulesInspector
          findings={hasPlan ? findings : findings.filter((f) => f.rule === "R2")}
          footer={
            isManager ? (
              <div className="grid gap-2">
                <Button
                  className="w-full"
                  disabled={!leave.can_approve || !pending}
                  busy={approve.isPending}
                  onClick={() =>
                    approve.mutate(undefined, {
                      onSuccess: () =>
                        setApprovedAt(
                          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        ),
                    })
                  }
                >
                  {hasPlan && !pending ? "Plan approved" : `Approve plan as ${me.name.split(" ")[0]}`}
                </Button>
                <p className="text-center text-2xs text-muted-foreground">
                  {approvedAt
                    ? `Approved at ${approvedAt} and written to the audit log.`
                    : leave.can_approve
                      ? "Every rule passes."
                      : "Approval unlocks when every rule passes."}
                </p>
                <ErrorNote
                  message={(propose.error ?? approve.error ?? reassign.error ?? answer.error)?.message}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Only {leave.manager.name} can approve this plan.
              </p>
            )
          }
        />
        {hasPlan && !pending && (
          <Badge tone="leaf">Every assignment ends by the return date plus {leave.handback_days} days</Badge>
        )}
      </div>
    </div>
  );
}
