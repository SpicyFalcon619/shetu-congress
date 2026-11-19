"use client";

import { useQueries, useQuery } from "@tanstack/react-query";

import {
  api,
  type ChangeRequest,
  type LeaveDetail,
  type Person,
  type ReturnView,
  unwrap,
} from "@/lib/api/client";
import { RULE_NAME } from "@/lib/labels";
import { type Stage, computeStages } from "@/lib/stages";

export type LeaveRow = {
  leave: LeaveDetail;
  stages: Stage[];
  changes: ChangeRequest[];
  ret?: ReturnView;
};

export type Task = {
  id: string;
  leaveId: string;
  stage: Stage["id"];
  title: string;
  detail: string;
  tone: "crimson" | "gold";
};

/** Every leave the persona can see, with its detail, open changes and return state. */
export function useWorkspace(me: Person | null) {
  const list = useQuery({
    queryKey: ["overview", "leaves", me?.id],
    queryFn: () => unwrap(api.GET("/api/v1/leaves")),
    enabled: Boolean(me),
  });
  const ids = list.data?.map((l) => l.id) ?? [];
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["overview", "row", id, me?.id],
      queryFn: async (): Promise<LeaveRow> => {
        const p = { params: { path: { leave_id: id } } };
        const [leave, changes, ret] = await Promise.all([
          unwrap(api.GET("/api/v1/leaves/{leave_id}", p)),
          unwrap(api.GET("/api/v1/leaves/{leave_id}/changes", p)),
          unwrap(api.GET("/api/v1/leaves/{leave_id}/return", p)),
        ]);
        return { leave, changes, ret, stages: computeStages(leave, changes, ret) };
      },
    })),
  });
  const rows: LeaveRow[] = results.flatMap((r) => (r.data ? [r.data] : []));
  const loading = list.isLoading || results.some((r) => r.isLoading);
  return { rows, loading };
}

/** What this persona needs to do now, derived from the same rules the API enforces. */
export function tasksFor(me: Person, rows: LeaveRow[]): Task[] {
  const tasks: Task[] = [];
  for (const { leave: l, changes, ret } of rows) {
    const first = l.employee.name.split(" ")[0];
    if (me.id === l.manager.id) {
      const asked = new Set(l.availability.map((a) => a.person_id));
      const unanswered = new Set(
        l.assignments.map((a) => a.cover_person_id).filter((p): p is string => Boolean(p) && !asked.has(p!)),
      );
      const failing = l.findings.filter((f) => !f.ok && f.rule !== "R2");
      const pending = l.assignments.some((a) => a.status === "proposed");
      if (l.duties.length && !l.assignments.length)
        tasks.push({
          id: `${l.id}-propose`,
          leaveId: l.id,
          stage: "cover",
          tone: "gold",
          title: `Propose cover for ${first}`,
          detail: `${l.duties.length} duties mapped and ready to plan`,
        });
      if (unanswered.size)
        tasks.push({
          id: `${l.id}-avail`,
          leaveId: l.id,
          stage: "cover",
          tone: "gold",
          title: `Answer ${unanswered.size} availability ${unanswered.size === 1 ? "question" : "questions"}`,
          detail: `Needed before ${first}'s plan can pass R4`,
        });
      else if (pending && failing.length)
        tasks.push({
          id: `${l.id}-fail`,
          leaveId: l.id,
          stage: "cover",
          tone: "crimson",
          title: `${first}'s cover plan is blocked`,
          detail: `${failing[0].rule} ${RULE_NAME[failing[0].rule]}: ${failing[0].message}`,
        });
      else if (pending && l.can_approve)
        tasks.push({
          id: `${l.id}-approve`,
          leaveId: l.id,
          stage: "cover",
          tone: "gold",
          title: `Approve ${first}'s cover plan`,
          detail: "Every rule passes",
        });
      const open = changes.filter((c) => c.status === "proposed").length;
      if (open)
        tasks.push({
          id: `${l.id}-changes`,
          leaveId: l.id,
          stage: "during",
          tone: "gold",
          title: `Decide ${open} reported ${open === 1 ? "change" : "changes"}`,
          detail: `During ${first}'s leave`,
        });
      if (ret && !ret.finding.ok)
        tasks.push({
          id: `${l.id}-r8`,
          leaveId: l.id,
          stage: "return",
          tone: "crimson",
          title: `${first}'s return is blocked`,
          detail: "R8: a duty moved for good without her agreement",
        });
    }
    if (me.id === l.employee.id) {
      if (!l.turns.length)
        tasks.push({
          id: `${l.id}-interview`,
          leaveId: l.id,
          stage: "map",
          tone: "gold",
          title: "Start your interview",
          detail: "About 15 minutes, in Bangla, English or Banglish",
        });
      const r2 = l.findings.find((f) => f.rule === "R2" && !f.ok);
      if (r2)
        tasks.push({
          id: `${l.id}-confirm`,
          leaveId: l.id,
          stage: "map",
          tone: "gold",
          title: `Answer ${r2.refs.length} suggested ${r2.refs.length === 1 ? "duty" : "duties"}`,
          detail: "Shetu thinks you may do these; only you can confirm",
        });
      if (ret && !ret.finding.ok)
        tasks.push({
          id: `${l.id}-decide`,
          leaveId: l.id,
          stage: "return",
          tone: "crimson",
          title: "Decide what happens to your duties",
          detail: "One duty stays with a colleague unless you agree",
        });
    }
  }
  return tasks;
}
