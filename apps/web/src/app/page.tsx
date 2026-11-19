"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ROLE_LABEL } from "@/components/site-header";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { api, unwrap } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { usePersona } from "@/lib/persona";

export default function Home() {
  const { me, people, choose, ready } = usePersona();
  const leaves = useQuery({
    queryKey: ["leaves", me?.id],
    queryFn: () => unwrap(api.GET("/api/v1/leaves")),
    enabled: Boolean(me),
  });

  const ROLE_ORDER = ["employee", "manager", "cover", "hr"];
  const ordered = [...people].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  const orgs = Array.from(new Set(people.map((p) => p.organization))).sort(
    (a, b) => Number(b.startsWith("Shapla")) - Number(a.startsWith("Shapla")),
  );

  return (
    <div className="grid gap-10">
      <section className="grid items-center gap-8 md:grid-cols-[1.6fr_1fr]">
        <div>
          <Eyebrow>AI Builders Congress 2026 · Team Anomaly</Eyebrow>
          <h1 className="mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl">
            Map her job.
            <br />
            Hold her role.
            <br />
            <span className="text-crimson">Guard her return.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Shetu keeps a job safe while its owner is on leave. It finds the work nobody wrote down, gives the
            manager a cover plan that has been checked, and makes sure the job she comes back to is the job
            she left.
          </p>
        </div>
        <div className="rounded-2xl bg-crimson px-6 py-8 text-center text-white md:justify-self-end md:px-10">
          <p className="font-bangla text-7xl leading-tight font-semibold">সেতু</p>
          <p className="mt-2 text-sm font-semibold text-blush">A bridge from her leave back to her career.</p>
        </div>
      </section>

      {ready && me && (
        <section>
          <Eyebrow>Your leaves</Eyebrow>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
            Signed in as {me.name},{" "}
            <span className="text-crimson">
              {me.role === "hr" ? "HR" : ROLE_LABEL[me.role]?.toLowerCase()}.
            </span>
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {leaves.data?.map((leave) => (
              <Link key={leave.id} href={`/leaves/${leave.id}`} className="group">
                <Card className="transition group-hover:ring-crimson">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold">{leave.employee.name}</p>
                      <p className="text-sm text-muted">{leave.employee.job_title}</p>
                    </div>
                    <Pill tone={leave.status === "closed" ? "leaf" : "crimson"}>{leave.status}</Pill>
                  </div>
                  <p className="mt-4 text-sm">
                    {formatDate(leave.starts_on)} to {formatDate(leave.ends_on)}
                  </p>
                  <p className="text-sm text-muted">Manager: {leave.manager.name}</p>
                </Card>
              </Link>
            ))}
            {leaves.data?.length === 0 && (
              <p className="text-muted">You are not part of any leave yet. Pick another persona above.</p>
            )}
          </div>
        </section>
      )}

      <section>
        <Eyebrow>Try it as</Eyebrow>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
          One engine, <span className="text-crimson">two very different leaves.</span>
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Nusrat is at an NGO; Arif is at a university. Shetu never asks why someone is away, so the same
          checks run for both.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {orgs.map((org) => (
            <Card key={org}>
              <p className="text-sm font-extrabold">{org}</p>
              <ul className="mt-3 divide-y divide-line">
                {ordered
                  .filter((p) => p.organization === org)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-bold">{p.name}</p>
                        <p className="truncate text-sm text-muted">{p.job_title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => choose(p.id)}
                        className={
                          me?.id === p.id
                            ? "rounded-lg bg-crimson px-3 py-1.5 text-xs font-bold text-white"
                            : "rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-line hover:ring-crimson"
                        }
                      >
                        {me?.id === p.id
                          ? "Current"
                          : `View as ${p.role === "hr" ? "HR" : ROLE_LABEL[p.role]?.toLowerCase()}`}
                      </button>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
