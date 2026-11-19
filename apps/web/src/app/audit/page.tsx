"use client";

import { useQueries } from "@tanstack/react-query";

import { PersonaPicker } from "@/components/persona-picker";
import { Avatar, Badge, Empty, PageHeader, Panel } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { useWorkspace } from "@/lib/overview";
import { usePersona } from "@/lib/persona";

const ACTION: Record<string, string> = {
  "cover.proposed": "Proposed a cover plan",
  "cover.approved": "Approved the cover plan",
  "availability.answered": "Recorded spare hours",
  "assignment.changed": "Changed an assignment",
  "change.reported": "Reported a change",
  "change.approved": "Approved a change",
  "change.rejected": "Rejected a change",
  "return.agree": "Agreed a duty stays with cover",
  "return.return": "Took a duty back",
  "leave.closed": "Closed the leave",
};

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function AuditPage() {
  const { me, people, ready } = usePersona();
  const { rows } = useWorkspace(me);
  const readable = rows.filter(({ leave }) => me && (leave.manager.id === me.id || me.role === "hr"));
  const logs = useQueries({
    queries: readable.map(({ leave }) => ({
      queryKey: ["audit", leave.id, me?.id],
      queryFn: () =>
        unwrap(api.GET("/api/v1/leaves/{leave_id}/audit", { params: { path: { leave_id: leave.id } } })),
    })),
  });

  if (!ready) return null;
  if (!me) return <PersonaPicker />;

  const names = new Map(people.map((p) => [p.id, p.name]));
  const events = readable
    .flatMap(({ leave }, i) => (logs[i]?.data ?? []).map((e) => ({ ...e, who: leave.employee.name })))
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="grid gap-5 [&>*]:min-w-0">
      <PageHeader
        title="Audit log"
        description="Every proposal, answer and approval, with who did it and when."
      />
      <Panel>
        {readable.length === 0 ? (
          <Empty title="Only managers and HR can read the log">Switch to Rafiq Ahmed or Farzana Haque.</Empty>
        ) : events.length === 0 ? (
          <Empty title="Nothing logged yet">Actions appear here as soon as a plan is proposed.</Empty>
        ) : (
          <ol className="divide-y divide-line">
            {events.map((e, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={names.get(e.actor_id) ?? "?"} size="sm" />
                <span className="min-w-0 flex-1 text-[13px]">
                  <b className="font-semibold">{names.get(e.actor_id)}</b>{" "}
                  {(ACTION[e.action] ?? e.action).toLowerCase()}
                </span>
                <Badge>{e.who}</Badge>
                <time className="w-28 text-right text-xs text-muted" dateTime={e.at}>
                  {fmt.format(new Date(e.at))}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
