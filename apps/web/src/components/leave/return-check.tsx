"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Card, ErrorNote, Eyebrow, Pill } from "@/components/ui";
import { api, type LeaveDetail, type Person, type ReturnView, unwrap } from "@/lib/api/client";
import { useLeaveAction } from "@/lib/leave";

import { RulePanel } from "./rule-panel";

const OUTCOME = {
  returns: { label: "returns to her", tone: "leaf" },
  changed: { label: "changed while away", tone: "gold" },
  stays_with_cover: { label: "stays with cover", tone: "neutral" },
} as const;

export function ReturnCheck({ leave, me }: { leave: LeaveDetail; me: Person }) {
  const qc = useQueryClient();
  const isManager = me.id === leave.manager.id;
  const isEmployee = me.id === leave.employee.id;
  const path = { params: { path: { leave_id: leave.id } } };
  const key = ["return", leave.id, me.id];
  const names = new Map(leave.team.map((p) => [p.id, p.name]));

  const view = useQuery({
    queryKey: key,
    queryFn: () => unwrap(api.GET("/api/v1/leaves/{leave_id}/return", path)),
  });
  const setView = (v: ReturnView) => qc.setQueryData(key, v);

  const forward = useMutation({
    mutationFn: () => unwrap(api.POST("/api/v1/leaves/{leave_id}/demo/fast-forward", path)),
    onSuccess: (v) => {
      setView(v);
      void qc.invalidateQueries({ queryKey: ["leave", leave.id] });
    },
  });
  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "agree" | "return" }) =>
      unwrap(
        api.POST("/api/v1/return-items/{item_id}/decision", {
          params: { path: { item_id: v.id } },
          body: { decision: v.decision },
        }),
      ),
    onSuccess: setView,
  });
  const explain = useMutation({
    mutationFn: () => unwrap(api.POST("/api/v1/leaves/{leave_id}/return/explain", path)),
  });
  const close = useLeaveAction(leave.id, me.id, () =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/close", path)),
  );

  const items = view.data?.items ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <Eyebrow>At return</Eyebrow>
        <h2 className="mt-3 text-xl font-extrabold">
          The job she comes back to <span className="text-crimson">is the job she left.</span>
        </h2>

        {items.length === 0 ? (
          <div className="mt-5 grid gap-3">
            <p className="text-sm text-muted">
              The return check opens on the return date. For the demo, the manager can jump forward to it.
            </p>
            {isManager && (
              <Button
                className="justify-self-start"
                variant="dark"
                onClick={() => forward.mutate()}
                busy={forward.isPending}
                disabled={leave.status === "planning"}
              >
                Jump to the return day (demo)
              </Button>
            )}
            {leave.status === "planning" && <p className="text-xs text-muted">Approve a cover plan first.</p>}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {items.map((i) => {
              const blocked = i.outcome === "stays_with_cover" && i.employee_agreed !== true;
              return (
                <li key={i.id} className="grid gap-1.5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{i.duty_title}</p>
                    <Pill tone={OUTCOME[i.outcome].tone}>{OUTCOME[i.outcome].label}</Pill>
                    {i.holder_id && <span className="text-xs text-muted">with {names.get(i.holder_id)}</span>}
                  </div>
                  <p className="text-sm text-muted">{i.note}</p>
                  {blocked && (
                    <p className="justify-self-start rounded-md bg-crimson px-3 py-1.5 text-xs font-bold text-white">
                      R8: moved for good without her agreement
                    </p>
                  )}
                  {blocked && isEmployee && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="ghost"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => decide.mutate({ id: i.id, decision: "agree" })}
                      >
                        I agree it stays
                      </Button>
                      <Button
                        className="px-3 py-1.5 text-xs"
                        onClick={() => decide.mutate({ id: i.id, decision: "return" })}
                      >
                        Return it to me
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <ErrorNote message={(forward.error ?? decide.error ?? close.error)?.message} />
      </Card>

      <div className="grid content-start gap-6">
        {view.data && items.length > 0 && (
          <Card>
            <Eyebrow>Rules check</Eyebrow>
            <div className="mt-3">
              <RulePanel findings={[view.data.finding]} />
            </div>
            {isManager && (
              <Button
                className="mt-4 w-full"
                disabled={!view.data.can_close || leave.status === "closed"}
                busy={close.isPending}
                onClick={() => close.mutate(undefined)}
              >
                {leave.status === "closed" ? "Leave closed" : "Close the leave"}
              </Button>
            )}
          </Card>
        )}
        {isEmployee && items.length > 0 && (
          <Card>
            <Eyebrow>What Shetu tells her</Eyebrow>
            {explain.data ? (
              <div className="mt-3 grid gap-3 text-sm leading-relaxed">
                <p>{explain.data.summary_en}</p>
                <p className="font-bangla text-base">{explain.data.summary_bn}</p>
              </div>
            ) : (
              <Button
                className="mt-3"
                variant="ghost"
                onClick={() => explain.mutate()}
                busy={explain.isPending}
              >
                Explain my return in Bangla and English
              </Button>
            )}
            <ErrorNote message={explain.error?.message} />
          </Card>
        )}
      </div>
    </div>
  );
}
