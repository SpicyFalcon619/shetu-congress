"use client";

import clsx from "clsx";
import { FileText, MessageSquareQuote, SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge, Button, Empty, ErrorNote, Panel, PanelHeader, type Tone } from "@/components/shared";
import { api, type Duty, type LeaveDetail, type Person, unwrap } from "@/lib/api/client";
import { useLeaveAction } from "@/lib/leave";

export function MapStage({ leave, me }: { leave: LeaveDetail; me: Person }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] [&>*]:min-w-0">
      <Interview leave={leave} me={me} />
      <RoleMap leave={leave} me={me} />
    </div>
  );
}

function Interview({ leave, me }: { leave: LeaveDetail; me: Person }) {
  const isEmployee = me.id === leave.employee.id;
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const path = { params: { path: { leave_id: leave.id } } };
  const first = leave.employee.name.split(" ")[0];

  const start = useLeaveAction(leave.id, me.id, () =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/interview/start", path)),
  );
  const reply = useLeaveAction(leave.id, me.id, (body: string) =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/interview/reply", { ...path, body: { text: body } })),
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [leave.turns.length, reply.isPending]);

  const send = () => {
    const t = text.trim();
    if (t) reply.mutate(t, { onSuccess: () => setText("") });
  };
  const asked = leave.turns.filter((t) => t.speaker === "shetu").length;

  return (
    <Panel className="flex min-h-[30rem] flex-col">
      <PanelHeader
        title="Interview"
        description={
          isEmployee
            ? "Describe your job in Bangla, English or Banglish. Shetu never asks why you are going on leave."
            : `${first} describes her job; you see the transcript.`
        }
        actions={leave.turns.length > 0 && <Badge>{Math.min(asked, 12)} of about 12 questions</Badge>}
      />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-sunk/50 px-4 py-4 xl:max-h-[34rem]">
        {leave.turns.length === 0 && (
          <Empty title={isEmployee ? "Ready when you are" : "Not started yet"}>
            {isEmployee
              ? "About 15 minutes. Answer in your own words; Shetu asks follow-up questions to find work that is not written down."
              : `${first} has not started the interview.`}
          </Empty>
        )}
        {leave.turns.map((t, i) => (
          <div
            key={i}
            className={clsx(
              "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap",
              t.speaker === "shetu"
                ? "self-start rounded-tl-sm border border-line bg-panel text-ink"
                : "self-end rounded-tr-sm bg-ink text-white",
            )}
          >
            {t.text}
          </div>
        ))}
        {reply.isPending && (
          <div className="self-start rounded-2xl rounded-tl-sm border border-line bg-panel px-3.5 py-2.5 text-[13px] text-muted-foreground">
            Reading your answer and updating the Role Map…
          </div>
        )}
        <div ref={endRef} />
      </div>
      {isEmployee && (
        <div className="border-t border-line p-3">
          {leave.turns.length === 0 ? (
            <Button onClick={() => start.mutate(undefined)} busy={start.isPending} className="w-full">
              Start the interview
            </Button>
          ) : leave.interview_done ? (
            <p className="px-1 text-[13px] font-semibold text-leaf">
              Interview complete. Review your Role Map and confirm it.
            </p>
          ) : (
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label htmlFor="answer" className="sr-only">
                Your answer
              </label>
              <textarea
                id="answer"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Type your answer. Enter sends, Shift+Enter adds a line."
                className="min-w-0 flex-1 resize-none rounded-lg border border-line-strong bg-panel px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus:border-crimson"
              />
              <Button type="submit" busy={reply.isPending} disabled={!text.trim()} aria-label="Send answer">
                <SendHorizontal className="size-4" aria-hidden />
              </Button>
            </form>
          )}
        </div>
      )}
      <div className="px-3">
        <ErrorNote message={(start.error ?? reply.error)?.message} />
      </div>
    </Panel>
  );
}

const EVIDENCE: Record<Duty["evidence"], { label: string; tone: Tone; icon: typeof FileText }> = {
  said: { label: "Said", tone: "leaf", icon: MessageSquareQuote },
  documented: { label: "Documented", tone: "gold", icon: FileText },
  suggested: { label: "Suggested", tone: "crimson", icon: Sparkles },
};

function RoleMap({ leave, me }: { leave: LeaveDetail; me: Person }) {
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

  const hours = leave.duties.reduce((s, d) => s + d.hours_per_week, 0);
  const hidden = leave.duties.filter((d) => d.source === "interview").length;
  const pending = leave.duties.filter((d) => d.evidence === "suggested" && !d.confirmed).length;

  return (
    <Panel>
      <PanelHeader
        title="Role Map"
        description="Every duty carries its evidence: her exact words, the job description, or a suggestion she must confirm."
      />
      {leave.duties.length > 0 && (
        <dl className="grid grid-cols-3 border-b border-line text-center">
          {[
            ["Duties", leave.duties.length],
            ["Not in job description", hidden],
            ["Hours a week", hours.toFixed(1)],
          ].map(([k, v]) => (
            <div key={k} className="border-r border-line px-3 py-3 last:border-r-0">
              <dd className="text-lg font-extrabold">{v}</dd>
              <dt className="text-2xs font-semibold text-muted-foreground">{k}</dt>
            </div>
          ))}
        </dl>
      )}
      {pending > 0 && (
        <p className="border-b border-line bg-blush/60 px-5 py-2 text-xs font-semibold text-crimson-ink">
          {pending} suggested {pending === 1 ? "duty needs" : "duties need"} {isEmployee ? "your" : "her"}{" "}
          answer before the cover plan can include {pending === 1 ? "it" : "them"} (R2).
        </p>
      )}
      {leave.duties.length === 0 ? (
        <Empty title="No duties yet">Duties appear here while the interview runs.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {leave.duties.map((d) => {
            const ev = EVIDENCE[d.evidence];
            const Icon = ev.icon;
            return (
              <li key={d.id} className="grid gap-1.5 px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 text-[13px] font-bold">{d.title}</p>
                  <Badge tone={ev.tone}>
                    <Icon className="size-3" aria-hidden />
                    {ev.label}
                  </Badge>
                  {d.confirmed && <Badge tone="leaf">Confirmed</Badge>}
                  <span className="w-28 text-right text-xs text-muted-foreground">
                    {d.frequency.replace("_", " ")} · {d.hours_per_week} h/wk
                  </span>
                </div>
                {d.quote ? (
                  <blockquote className="rounded-md bg-sunk px-3 py-2 text-xs leading-relaxed text-ink-2">
                    &ldquo;{d.quote}&rdquo;
                  </blockquote>
                ) : (
                  d.detail && <p className="text-xs text-muted-foreground">{d.detail}</p>
                )}
                {d.flag && <p className="text-xs font-semibold text-crimson-ink">{d.flag}</p>}
                {isEmployee && !d.confirmed && (
                  <div className="flex gap-2 pt-0.5">
                    <Button size="sm" onClick={() => patch.mutate({ id: d.id, confirmed: true })}>
                      {d.evidence === "suggested" ? "Yes, I do this" : "Confirm"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => remove.mutate(d.id)}>
                      {d.evidence === "suggested" ? "No, I don't" : "Remove"}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="px-5 pb-1">
        <ErrorNote message={(patch.error ?? remove.error)?.message} />
      </div>
    </Panel>
  );
}
