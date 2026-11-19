import type { ChangeRequest, LeaveDetail, ReturnView } from "@/lib/api/client";
import { RULE_NAME } from "@/lib/labels";

export type StageId = "map" | "cover" | "during" | "return";
export type StageState = "done" | "active" | "blocked" | "waiting";

export type Stage = {
  id: StageId;
  label: string;
  verb: string;
  state: StageState;
  note: string;
};

export const STAGE_ORDER: StageId[] = ["map", "cover", "during", "return"];

const COVER_RULES = new Set(["R3", "R4", "R5", "R6", "R7"]);

export function computeStages(leave: LeaveDetail, changes: ChangeRequest[] = [], ret?: ReturnView): Stage[] {
  const r2 = leave.findings.find((f) => f.rule === "R2");
  const pendingSuggestions = r2 && !r2.ok ? r2.refs.length : 0;
  const hasDuties = leave.duties.length > 0;
  const planApproved =
    leave.assignments.length > 0 && leave.assignments.every((a) => a.status === "approved");
  const coverFail = leave.findings.find((f) => !f.ok && COVER_RULES.has(f.rule));
  const openChanges = changes.filter((c) => c.status === "proposed").length;
  const atReturn = leave.status === "returning" || leave.status === "closed";

  const map: Stage = !leave.turns.length
    ? {
        id: "map",
        label: "Before leave",
        verb: "Map the job",
        state: "active",
        note: "Interview not started",
      }
    : pendingSuggestions
      ? {
          id: "map",
          label: "Before leave",
          verb: "Map the job",
          state: "blocked",
          note: `${pendingSuggestions} duties need the employee's answer`,
        }
      : {
          id: "map",
          label: "Before leave",
          verb: "Map the job",
          state: hasDuties ? "done" : "active",
          note: hasDuties ? `${leave.duties.length} duties mapped` : "Interview in progress",
        };

  const cover: Stage = planApproved
    ? coverFail
      ? {
          id: "cover",
          label: "Cover plan",
          verb: "Hold the role",
          state: "blocked",
          note: `${coverFail.rule} ${RULE_NAME[coverFail.rule]} failing`,
        }
      : {
          id: "cover",
          label: "Cover plan",
          verb: "Hold the role",
          state: "done",
          note: `Approved · ${leave.assignments.length} assignments`,
        }
    : !leave.assignments.length
      ? {
          id: "cover",
          label: "Cover plan",
          verb: "Hold the role",
          state: map.state === "done" ? "active" : "waiting",
          note: map.state === "done" ? "Ready to propose" : "Waits for the Role Map",
        }
      : coverFail
        ? {
            id: "cover",
            label: "Cover plan",
            verb: "Hold the role",
            state: "blocked",
            note: `${coverFail.rule} ${RULE_NAME[coverFail.rule]} failing`,
          }
        : {
            id: "cover",
            label: "Cover plan",
            verb: "Hold the role",
            state: "active",
            note: "Ready for approval",
          };

  const during: Stage = atReturn
    ? { id: "during", label: "During leave", verb: "Hold the plan", state: "done", note: "Leave ended" }
    : leave.status === "active"
      ? {
          id: "during",
          label: "During leave",
          verb: "Hold the plan",
          state: openChanges ? "blocked" : "active",
          note: openChanges ? `${openChanges} change waiting` : "No open changes",
        }
      : {
          id: "during",
          label: "During leave",
          verb: "Hold the plan",
          state: "waiting",
          note: "Starts when approved",
        };

  const r8 = ret?.finding;
  const back: Stage =
    leave.status === "closed"
      ? { id: "return", label: "At return", verb: "Guard the return", state: "done", note: "Leave closed" }
      : leave.status === "returning"
        ? r8 && !r8.ok
          ? {
              id: "return",
              label: "At return",
              verb: "Guard the return",
              state: "blocked",
              note: "R8 Return guard failing",
            }
          : {
              id: "return",
              label: "At return",
              verb: "Guard the return",
              state: "active",
              note: "Ready to close",
            }
        : {
            id: "return",
            label: "At return",
            verb: "Guard the return",
            state: "waiting",
            note: "On the return date",
          };

  return [map, cover, during, back];
}

/** Index of the stage the leave is working on now. */
export function currentStageIndex(stages: Stage[]): number {
  const i = stages.findIndex((s) => s.state !== "done");
  return i === -1 ? stages.length - 1 : i;
}
