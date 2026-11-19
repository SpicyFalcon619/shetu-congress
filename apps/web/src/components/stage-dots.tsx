import clsx from "clsx";

import type { Stage } from "@/lib/stages";

/** A compact version of the bridge: four piers on a deck, for tables and lists. */
export function StageDots({ stages }: { stages: Stage[] }) {
  return (
    <span className="flex items-center" aria-label={stages.map((s) => `${s.label}: ${s.state}`).join(", ")}>
      {stages.map((s, i) => (
        <span key={s.id} className="flex items-center">
          {i > 0 && (
            <span
              aria-hidden
              className={clsx("h-0.5 w-5", stages[i - 1].state === "done" ? "bg-crimson" : "bg-line-strong")}
            />
          )}
          <span
            aria-hidden
            title={`${s.label}: ${s.note}`}
            className={clsx(
              "size-2.5 rounded-full",
              s.state === "done" && "bg-crimson",
              s.state === "blocked" && "bg-crimson ring-4 ring-crimson/20",
              s.state === "active" && "border-2 border-crimson bg-panel",
              s.state === "waiting" && "border-2 border-line-strong bg-panel",
            )}
          />
        </span>
      ))}
    </span>
  );
}
