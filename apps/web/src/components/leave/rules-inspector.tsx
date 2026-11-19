import clsx from "clsx";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

import { Panel } from "@/components/shared";
import type { Finding } from "@/lib/api/client";
import { RULE_NAME } from "@/lib/labels";

export function RulesInspector({
  title = "Rules check",
  findings,
  footer,
}: {
  title?: string;
  findings: Finding[];
  footer?: ReactNode;
}) {
  const failing = findings.filter((f) => !f.ok).length;
  return (
    <Panel>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-[13px] font-bold">{title}</h2>
        <span className={clsx("text-xs font-semibold", failing ? "text-crimson-ink" : "text-leaf")}>
          {findings.length === 0 ? "Nothing to check yet" : failing ? `${failing} failing` : "All passing"}
        </span>
      </header>
      <ul className="divide-y divide-line" aria-label={title}>
        {findings.map((f) => (
          <li key={f.rule} className="flex gap-3 px-4 py-3">
            <span
              className={clsx(
                "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                f.ok ? "bg-leaf-soft text-leaf" : "bg-crimson text-white",
              )}
            >
              {f.ok ? (
                <Check className="size-3" strokeWidth={3} aria-label="Passes" />
              ) : (
                <X className="size-3" strokeWidth={3} aria-label="Fails" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">
                {RULE_NAME[f.rule] ?? f.rule}{" "}
                <span className="font-normal text-muted-foreground">· {f.rule}</span>
              </p>
              <p
                className={clsx(
                  "mt-0.5 text-xs leading-relaxed",
                  f.ok ? "text-muted-foreground" : "text-crimson-ink",
                )}
              >
                {f.message}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {footer && <div className="border-t border-line p-4">{footer}</div>}
    </Panel>
  );
}
