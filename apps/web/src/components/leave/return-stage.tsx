"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { FastForward, Languages } from "lucide-react";

import { Avatar, Badge, Button, Empty, ErrorNote, Panel, PanelHeader, type Tone } from "@/components/ui";
import { api, type LeaveDetail, type Person, type ReturnView, unwrap } from "@/lib/api/client";
import { useLeaveAction } from "@/lib/leave";

import { RulesInspector } from "./rules-inspector";

const OUTCOME: Record<string, { label: string; tone: Tone }> = {
  returns: { label: "Returns to her", tone: "leaf" },
  changed: { label: "Changed while away", tone: "gold" },
  stays_with_cover: { label: "Stays with cover", tone: "neutral" },
};

export function ReturnStage({ leave, me, view }: { leave: LeaveDetail; me: Person; view?: ReturnView }) {
  const qc = useQueryClient();
  const isManager = me.id === leave.manager.id;
  const isEmployee = me.id === leave.employee.id;
  const first = leave.employee.name.split(" ")[0];
  const path = { params: { path: { leave_id: leave.id } } };
  const names = new Map(leave.team.map((p) => [p.id, p.name]));
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["return", leave.id] });
    void qc.invalidateQueries({ queryKey: ["leave", leave.id] });
  };

  const forward = useMutation({
    mutationFn: () => unwrap(api.POST("/api/v1/leaves/{leave_id}/demo/fast-forward", path)),
    onSuccess: refresh,
  });
  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "agree" | "return" }) =>
      unwrap(
        api.POST("/api/v1/return-items/{item_id}/decision", {
          params: { path: { item_id: v.id } },
          body: { decision: v.decision },
        }),
      ),
    onSuccess: refresh,
  });
  const explain = useMutation({
    mutationFn: () => unwrap(api.POST("/api/v1/leaves/{leave_id}/return/explain", path)),
  });
  const close = useLeaveAction(leave.id, me.id, () =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/close", path)),
  );

  const items = view?.items ?? [];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
      <div className="grid content-start gap-5">
        <Panel>
          <PanelHeader
            title="Return check"
            description={`${first}'s job then and now. Nothing moves to a colleague for good without her agreement.`}
          />
          {items.length === 0 ? (
            <Empty title="Opens on the return date">
              {leave.status === "planning"
                ? "Approve a cover plan first."
                : isManager
                  ? "For the demo, jump ahead to the return day with a scripted set of outcomes."
                  : `${leave.manager.name} opens the return check on the return date.`}
              {isManager && leave.status === "active" && (
                <div className="mt-4">
                  <Button variant="secondary" onClick={() => forward.mutate()} busy={forward.isPending}>
                    <FastForward className="size-3.5" aria-hidden />
                    Jump to the return day (demo)
                  </Button>
                </div>
              )}
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((i) => {
                const blocked = i.outcome === "stays_with_cover" && i.employee_agreed !== true;
                const o = OUTCOME[i.outcome];
                return (
                  <li key={i.id} className={clsx("grid gap-2 px-5 py-4", blocked && "bg-blush/60")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 flex-1 text-[13px] font-bold">{i.duty_title}</p>
                      {i.holder_id && (
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <Avatar name={names.get(i.holder_id) ?? "?"} size="sm" />
                          {names.get(i.holder_id)}
                        </span>
                      )}
                      <Badge tone={o.tone}>{o.label}</Badge>
                    </div>
                    <p className="text-xs text-muted">{i.note}</p>
                    {blocked && (
                      <p className="text-xs font-bold text-crimson-ink">
                        R8: moved for good without her agreement. The leave cannot close until she decides.
                      </p>
                    )}
                    {blocked && isEmployee && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => decide.mutate({ id: i.id, decision: "return" })}>
                          Return it to me
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => decide.mutate({ id: i.id, decision: "agree" })}
                        >
                          I agree it stays
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="px-5 pb-1">
            <ErrorNote message={(forward.error ?? decide.error ?? close.error)?.message} />
          </div>
        </Panel>

        {isEmployee && items.length > 0 && (
          <Panel>
            <PanelHeader
              title="Your return, explained"
              description="Written by Shetu from the comparison above, in Bangla and English."
              actions={
                !explain.data && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => explain.mutate()}
                    busy={explain.isPending}
                  >
                    <Languages className="size-3.5" aria-hidden />
                    Explain
                  </Button>
                )
              }
            />
            {explain.data ? (
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <p className="text-[13px] leading-relaxed">{explain.data.summary_en}</p>
                <p className="font-bangla text-[15px] leading-relaxed">{explain.data.summary_bn}</p>
              </div>
            ) : (
              <p className="px-5 py-4 text-[13px] text-muted">
                Ask Shetu to explain what changed, in plain words.
              </p>
            )}
            <div className="px-5 pb-1">
              <ErrorNote message={explain.error?.message} />
            </div>
          </Panel>
        )}
      </div>

      {view && items.length > 0 && (
        <RulesInspector
          findings={[view.finding]}
          footer={
            isManager ? (
              <div className="grid gap-2">
                <Button
                  className="w-full"
                  disabled={!view.can_close || leave.status === "closed"}
                  busy={close.isPending}
                  onClick={() => close.mutate(undefined)}
                >
                  {leave.status === "closed" ? "Leave closed" : "Close the leave"}
                </Button>
                <p className="text-center text-2xs text-muted">
                  {leave.status === "closed"
                    ? "Every temporary assignment has ended."
                    : view.can_close
                      ? "Every duty is settled."
                      : `Waiting for ${first}'s decision.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted">Only {leave.manager.name} can close the leave.</p>
            )
          }
        />
      )}
    </div>
  );
}
