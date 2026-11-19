"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button, Card, ErrorNote, Eyebrow, Pill } from "@/components/ui";
import { api, type LeaveDetail, type Person, unwrap } from "@/lib/api/client";
import { useLeaveAction } from "@/lib/leave";

const KIND: Record<string, string> = {
  cover_unavailable: "Cover unavailable",
  duty_changed: "Duty changed",
  new_duty: "New duty",
  date_change: "Date change",
  other: "Other",
};

export function ChangesPanel({ leave, me }: { leave: LeaveDetail; me: Person }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const isManager = me.id === leave.manager.id;
  const canReport = isManager || leave.assignments.some((a) => a.cover_person_id === me.id);
  const path = { params: { path: { leave_id: leave.id } } };

  const changes = useQuery({
    queryKey: ["changes", leave.id, me.id],
    queryFn: () => unwrap(api.GET("/api/v1/leaves/{leave_id}/changes", path)),
  });
  const report = useMutation({
    mutationFn: (t: string) =>
      unwrap(api.POST("/api/v1/leaves/{leave_id}/changes", { ...path, body: { text: t } })),
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <Eyebrow>During leave</Eyebrow>
        <h2 className="mt-3 text-xl font-extrabold">
          Report a change <span className="text-crimson">in one sentence.</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Bangla, English or Banglish. The AI reads it, the rules re-check the plan, and {leave.manager.name}{" "}
          approves. Nothing is sent to {leave.employee.name.split(" ")[0]} while she is away.
        </p>
        {canReport ? (
          <form
            className="mt-4 grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim().length >= 3) report.mutate(text.trim());
            }}
          >
            <label htmlFor="change" className="sr-only">
              Describe the change
            </label>
            <textarea
              id="change"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Karim can't do the monthly report from next week"
              className="rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:ring-crimson"
            />
            <Button
              type="submit"
              className="justify-self-start"
              busy={report.isPending}
              disabled={text.trim().length < 3}
            >
              Report change
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Only the manager or a covering colleague can report a change.
          </p>
        )}
        <ErrorNote message={(report.error ?? decide.error)?.message} />
      </Card>

      <Card>
        <Eyebrow>Reported changes</Eyebrow>
        <ul className="mt-3 divide-y divide-line">
          {changes.data?.length === 0 && (
            <li className="py-4 text-sm text-muted">No changes reported yet.</li>
          )}
          {changes.data?.map((c) => {
            const p = c.parsed as { kind?: string; summary?: string; duty_title?: string | null };
            return (
              <li key={c.id} className="grid gap-1.5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="gold">{KIND[p.kind ?? "other"] ?? p.kind}</Pill>
                  <Pill
                    tone={c.status === "approved" ? "leaf" : c.status === "rejected" ? "neutral" : "crimson"}
                  >
                    {c.status}
                  </Pill>
                </div>
                <p className="text-sm text-muted italic">&ldquo;{c.raw_text}&rdquo;</p>
                <p className="text-sm font-semibold">{p.summary}</p>
                {isManager && c.status === "proposed" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="px-3 py-1.5 text-xs"
                      busy={decide.isPending}
                      onClick={() => decide.mutate({ id: c.id, approve: true })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1.5 text-xs"
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
        {isManager && (
          <p className="mt-3 text-xs text-muted">
            Approving a &ldquo;cover unavailable&rdquo; change frees that duty, so the cover plan shows the
            gap until you give it a new owner.
          </p>
        )}
      </Card>
    </div>
  );
}
