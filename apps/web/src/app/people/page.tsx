"use client";

import { PersonaPicker } from "@/components/persona-picker";
import { Avatar, Badge, PageHeader, Panel } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/labels";
import { useWorkspace } from "@/lib/overview";
import { usePersona } from "@/lib/persona";

export default function PeoplePage() {
  const { me, people, ready } = usePersona();
  const { rows } = useWorkspace(me);

  if (!ready) return null;
  if (!me) return <PersonaPicker />;

  const team = people.filter((p) => p.organization === me.organization);
  const hours = new Map<string, number>();
  const onLeave = new Set<string>();
  for (const { leave } of rows) {
    if (leave.status === "active" || leave.status === "returning") onLeave.add(leave.employee.id);
    for (const a of leave.assignments) {
      const d = leave.duties.find((x) => x.id === a.duty_id);
      if (a.cover_person_id && d)
        hours.set(a.cover_person_id, (hours.get(a.cover_person_id) ?? 0) + d.hours_per_week);
    }
  }

  return (
    <div className="grid gap-5 [&>*]:min-w-0">
      <PageHeader title="People" description={me.organization} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-2xs font-semibold text-muted">
                <th className="px-5 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Role in Shetu</th>
                <th className="px-3 py-2.5 font-semibold">Team</th>
                <th className="px-3 py-2.5 font-semibold">Skills</th>
                <th className="px-5 py-2.5 text-right font-semibold">Cover held</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {team.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <Avatar name={p.name} />
                      <span>
                        <span className="block font-bold">
                          {p.name} {onLeave.has(p.id) && <Badge tone="crimson">On leave</Badge>}
                        </span>
                        <span className="block text-xs text-muted">{p.job_title}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-ink-2">{ROLE_LABEL[p.role]}</td>
                  <td className="px-3 py-3 text-ink-2">{p.team}</td>
                  <td className="px-3 py-3">
                    <span className="flex flex-wrap gap-1">
                      {p.skills.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {hours.get(p.id) ? `${hours.get(p.id)} h/wk` : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="text-xs text-muted">
        Shetu never scores or ranks people. Cover held is shown so no one is overloaded.
      </p>
    </div>
  );
}
