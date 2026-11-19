"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { Button, Card, ErrorNote, Eyebrow } from "@/components/ui";
import { api, type LeaveDetail, type Person, unwrap } from "@/lib/api/client";
import { useLeaveAction } from "@/lib/leave";

export function Interview({ leave, me }: { leave: LeaveDetail; me: Person }) {
  const isEmployee = me.id === leave.employee.id;
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const path = { params: { path: { leave_id: leave.id } } };

  const start = useLeaveAction(leave.id, me.id, () =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/interview/start", path)),
  );
  const reply = useLeaveAction(leave.id, me.id, (body: string) =>
    unwrap(api.POST("/api/v1/leaves/{leave_id}/interview/reply", { ...path, body: { text: body } })),
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [leave.turns.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    reply.mutate(t, { onSuccess: () => setText("") });
  };

  return (
    <Card className="flex flex-col">
      <Eyebrow>Interview</Eyebrow>
      <h2 className="mt-3 text-xl font-extrabold">
        Describe the job <span className="text-crimson">in your own words.</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Bangla, English or Banglish. Shetu asks one question at a time and never asks why you are going on
        leave.
      </p>

      <div className="mt-4 flex max-h-[28rem] min-h-48 flex-col gap-3 overflow-y-auto rounded-lg bg-paper p-3">
        {leave.turns.length === 0 && (
          <p className="m-auto text-center text-sm text-muted">
            {isEmployee
              ? "Start when you are ready. It takes about 15 minutes."
              : "The interview has not started yet."}
          </p>
        )}
        {leave.turns.map((t, i) => (
          <div
            key={i}
            className={clsx(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              t.speaker === "shetu"
                ? "self-start bg-card ring-1 ring-line"
                : "self-end bg-crimson text-white",
            )}
          >
            {t.text}
          </div>
        ))}
        {reply.isPending && (
          <div className="self-start rounded-2xl bg-card px-4 py-2.5 text-sm text-muted ring-1 ring-line">
            Reading your answer…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {isEmployee &&
        (leave.turns.length === 0 ? (
          <Button className="mt-4 self-start" onClick={() => start.mutate(undefined)} busy={start.isPending}>
            Start the interview
          </Button>
        ) : leave.interview_done ? (
          <p className="mt-4 text-sm font-semibold text-leaf">
            Interview complete. Check your Role Map and confirm it.
          </p>
        ) : (
          <form
            className="mt-4 flex gap-2"
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
              placeholder="Type your answer…"
              className="min-w-0 flex-1 resize-none rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:ring-crimson"
            />
            <Button type="submit" busy={reply.isPending} disabled={!text.trim()}>
              Send
            </Button>
          </form>
        ))}
      <ErrorNote message={(start.error ?? reply.error)?.message} />
    </Card>
  );
}
