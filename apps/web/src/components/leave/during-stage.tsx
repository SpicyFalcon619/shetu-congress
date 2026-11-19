"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";

import { Avatar, Badge, Button, Empty, ErrorNote, Panel, PanelHeader } from "@/components/shared";
import { api, type ChangeRequest, type LeaveDetail, type Person, unwrap } from "@/lib/api/client";
import { useLeaveAction } from "@/lib/leave";

const KIND: Record<string, string> = {
  cover_unavailable: "Cover unavailable",
  duty_changed: "Duty changed",
  new_duty: "New duty",
  date_change: "Date change",
  other: "Other",
};

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function DuringStage({
  leave,
  me,
  changes,
}: {
  leave: LeaveDetail;
  me: Person;
  changes: ChangeRequest[];
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const isManager = me.id === leave.manager.id;
  const canReport = isManager || leave.assignments.some((a) => a.cover_person_id === me.id);
  const first = leave.employee.name.split(" ")[0];
  const names = new Map([...leave.team, leave.manager].map((p) => [p.id, p.name]));

  const report = useMutation({
    mutationFn: (t: string) =>
      unwrap(
        api.POST("/api/v1/leaves/{leave_id}/changes", {
          params: { path: { leave_id: leave.id } },
          body: { text: t },
        }),
      ),
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["changes", leave.id] });
    },
  });
  const decide = useLeaveAction(leave.id, me.id, (v: { id: string; approve: boolean }) =>
    unwrap(
      api.POST("/api/v1/changes/{change_id}/decision", {
        params: { path: { change_id: v.id } },
        body: { approve: v.approve },
      }),
    ),
  );

  const sorted = [...changes].sort(
    (a, b) => Number(b.status === "proposed") - Number(a.status === "proposed"),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
      <Panel>
        <PanelHeader
          title="Changes during leave"
          description={`Open changes stay highlighted until ${leave.manager.name} decides. Nothing is ever sent to ${first} while she is away.`}
          actions={
            changes.some((c) => c.status === "proposed") && (
              <Badge tone="gold">{changes.filter((c) => c.status === "proposed").length} open</Badge>
            )
          }
        />
        {sorted.length === 0 ? (
          <Empty title="No changes reported">
            When a covering colleague can no longer hold a duty, or a duty changes, it appears here.
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {sorted.map((c) => {
              const p = c.parsed as { kind?: string; summary?: string; duty_title?: string | null };
              const open = c.status === "proposed";
              return (
                <li
                  key={c.id}
                  className={clsx(
                    "grid gap-2 px-5 py-4 transition-colors duration-700",
                    open ? "bg-gold-soft/70" : "bg-panel",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar name={names.get(c.created_by_id) ?? "?"} size="sm" />
                    <span className="text-[13px] font-semibold">
                      {names.get(c.created_by_id) ?? "Someone"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeFmt.format(new Date(c.created_at))}
                    </span>
                    <span className="ml-auto flex gap-1.5">
                      <Badge tone="neutral">{KIND[p.kind ?? "other"] ?? p.kind}</Badge>
                      <Badge tone={open ? "gold" : c.status === "approved" ? "leaf" : "neutral"}>
                        {open ? "Waiting for decision" : c.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    </span>
                  </div>
                  <p className="text-[13px] text-ink-2 italic">&ldquo;{c.raw_text}&rdquo;</p>
                  <p className="text-[13px] font-semibold">
                    {p.summary}
                    {p.duty_title && (
                      <span className="font-normal text-muted-foreground"> · {p.duty_title}</span>
                    )}
                  </p>
                  {isManager && open && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        busy={decide.isPending}
                        onClick={() => decide.mutate({ id: c.id, approve: true })}
                      >
                        Approve and re-check plan
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => decide.mutate({ id: c.id, approve: false })}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel className="self-start">
        <PanelHeader
          title="Report a change"
          description="One sentence in Bangla, English or Banglish. Shetu reads it and the rules re-check the plan."
        />
        <div className="p-4">
          {leave.status === "planning" ? (
            <p className="text-[13px] text-muted-foreground">Changes open once the cover plan is approved.</p>
          ) : canReport ? (
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim().length >= 3) report.mutate(text.trim());
              }}
            >
              <label htmlFor="change" className="text-xs font-semibold text-ink-2">
                What changed?
              </label>
              <textarea
                id="change"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Ami ar donor reconciliation korte parbo na from next week"
                className="resize-none rounded-lg border border-line-strong bg-panel px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus:border-crimson"
              />
              <Button type="submit" busy={report.isPending} disabled={text.trim().length < 3}>
                Report change
              </Button>
            </form>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Only the manager or a covering colleague can report a change.
            </p>
          )}
          <ErrorNote message={(report.error ?? decide.error)?.message} />
        </div>
      </Panel>
    </div>
  );
}
