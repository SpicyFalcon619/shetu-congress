"use client";

import { ArrowRight } from "lucide-react";

import { ROLE_LABEL } from "@/lib/labels";
import { usePersona } from "@/lib/persona";

import { ArchLogo } from "./arch-logo";
import { Avatar, Panel } from "./ui";

const ROLE_ORDER = ["manager", "employee", "cover", "hr"];

/** Demo sign-in: choose who you are. Every permission is still checked by the API. */
export function PersonaPicker() {
  const { people, choose } = usePersona();
  const orgs = [...new Set(people.map((p) => p.organization))].sort(
    (a, b) => Number(b.startsWith("Shapla")) - Number(a.startsWith("Shapla")),
  );
  return (
    <div className="mx-auto grid max-w-3xl gap-6 py-6">
      <div className="text-center">
        <ArchLogo className="mx-auto h-10 w-auto" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">Sign in to the demo workspace</h1>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">
          Choose who you are. Two synthetic organizations run on the same engine; Shetu never asks why someone
          is away.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {orgs.map((org) => (
          <Panel key={org}>
            <h2 className="border-b border-line px-4 py-3 text-[13px] font-bold">{org}</h2>
            <ul className="divide-y divide-line">
              {people
                .filter((p) => p.organization === org)
                .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
                .map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => choose(p.id)}
                      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-sunk/60"
                    >
                      <Avatar name={p.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold">{p.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {ROLE_LABEL[p.role]} · {p.job_title}
                        </span>
                      </span>
                      <ArrowRight
                        className="size-4 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
            </ul>
          </Panel>
        ))}
      </div>
      <p className="text-center text-xs text-muted">
        Start as <b className="text-ink-2">Rafiq Ahmed</b> (manager) or{" "}
        <b className="text-ink-2">Nusrat Jahan</b> (employee).
      </p>
    </div>
  );
}
