import clsx from "clsx";

import type { Finding } from "@/lib/api/client";

const NAMES: Record<string, string> = {
  R1: "Quote check",
  R2: "Her confirmation",
  R3: "Full coverage",
  R4: "Capacity",
  R5: "No work sent to her",
  R6: "Every assignment ends",
  R7: "Fresh facts",
  R8: "Return guard",
};

export function RulePanel({ findings }: { findings: Finding[] }) {
  return (
    <ul className="grid gap-2" aria-label="Rule checks">
      {findings.map((f) => (
        <li
          key={f.rule}
          className={clsx(
            "grid grid-cols-[2.75rem_1fr] gap-2 rounded-lg px-3 py-2.5 text-sm leading-snug",
            f.ok ? "bg-leaf-soft" : "bg-blush",
          )}
        >
          <span className={clsx("font-mono text-xs font-bold", f.ok ? "text-leaf" : "text-crimson")}>
            {f.rule}
          </span>
          <span>
            <span className="font-bold">
              {NAMES[f.rule] ?? f.rule}: {f.ok ? "passes." : "fails."}
            </span>{" "}
            {f.message}
          </span>
        </li>
      ))}
    </ul>
  );
}
