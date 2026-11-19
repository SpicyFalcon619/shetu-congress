"use client";

import clsx from "clsx";
import { AlertTriangle, Check } from "lucide-react";
import { useRef } from "react";

import { type Stage, type StageId, currentStageIndex } from "@/lib/stages";

// Geometry in a 1000-wide viewBox. Piers sit at the centres of four equal columns, so the
// HTML stage tabs underneath line up with them at every width.
const W = 1000;
const DECK_Y = 118;
const ARCH = { x0: 46, x1: 954, peak: -44 };
const PIERS = [125, 375, 625, 875];
const HANGERS = Array.from({ length: 23 }, (_, i) => 96 + i * 36.5);

function archY(x: number) {
  const t = (x - ARCH.x0) / (ARCH.x1 - ARCH.x0);
  return (1 - t) ** 2 * DECK_Y + 2 * (1 - t) * t * ARCH.peak + t ** 2 * DECK_Y;
}

const ARCH_PATH = `M${ARCH.x0} ${DECK_Y} Q${W / 2} ${ARCH.peak} ${ARCH.x1} ${DECK_Y}`;

export function Bridge({
  stages,
  selected,
  onSelect,
}: {
  stages: Stage[];
  selected: StageId;
  onSelect: (id: StageId) => void;
}) {
  const current = currentStageIndex(stages);
  const allDone = stages.every((s) => s.state === "done");
  // Progress runs from the start of the arch to the current pier (to the end when closed).
  const progressX = allDone ? ARCH.x1 : PIERS[current];
  const progress = (progressX - ARCH.x0) / (ARCH.x1 - ARCH.x0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null || next < 0 || next >= stages.length) return;
    e.preventDefault();
    onSelect(stages[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <div className="rounded-xl border border-line bg-panel px-3 pt-4 pb-3 sm:px-5">
      <svg viewBox={`0 0 ${W} 132`} className="hidden h-auto w-full sm:block" aria-hidden>
        {HANGERS.map((x) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={archY(x) + 4}
            y2={DECK_Y - 3}
            className={clsx(
              "transition-[stroke] duration-700",
              x <= progressX ? "stroke-rose" : "stroke-line",
            )}
            strokeWidth={4}
          />
        ))}
        <path d={ARCH_PATH} fill="none" className="stroke-line" strokeWidth={9} strokeLinecap="round" />
        <path
          d={ARCH_PATH}
          fill="none"
          className="stroke-crimson transition-[stroke-dashoffset] duration-1000 ease-out-expo"
          strokeWidth={9}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - progress}
        />
        <line
          x1={20}
          x2={980}
          y1={DECK_Y}
          y2={DECK_Y}
          className="stroke-ink"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {PIERS.map((x, i) => {
          const s = stages[i];
          return (
            <g key={s.id}>
              <circle
                cx={x}
                cy={DECK_Y}
                r={11}
                className={clsx(
                  s.state === "done" && "fill-crimson",
                  s.state === "blocked" && "fill-crimson",
                  s.state === "active" && "fill-panel stroke-crimson",
                  s.state === "waiting" && "fill-panel stroke-line-strong",
                )}
                strokeWidth={4}
              />
              {s.state === "blocked" && (
                <circle cx={x} cy={DECK_Y} r={18} fill="none" className="stroke-crimson/30" strokeWidth={3} />
              )}
            </g>
          );
        })}
      </svg>

      <div
        role="tablist"
        aria-label="Leave stages"
        className="grid grid-cols-2 gap-1.5 sm:mt-3 sm:grid-cols-4"
      >
        {stages.map((s, i) => {
          const isSel = s.id === selected;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${s.id}`}
              aria-selected={isSel}
              aria-controls={`panel-${s.id}`}
              tabIndex={isSel ? 0 : -1}
              onClick={() => onSelect(s.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={clsx(
                "group rounded-lg px-3 py-2 text-left transition-colors sm:text-center",
                isSel ? "bg-sunk" : "hover:bg-sunk/60",
              )}
            >
              <span className="flex items-center gap-1.5 sm:justify-center">
                <StateIcon state={s.state} />
                <span className={clsx("text-[13px] font-bold", isSel ? "text-ink" : "text-ink-2")}>
                  {s.label}
                </span>
              </span>
              <span
                className={clsx(
                  "mt-0.5 block text-xs",
                  s.state === "blocked" ? "font-semibold text-crimson-ink" : "text-muted-foreground",
                )}
              >
                {s.note}
              </span>
              <span
                aria-hidden
                className={clsx(
                  "mx-auto mt-2 block h-0.5 rounded-full transition-all duration-300",
                  isSel ? "w-10 bg-crimson" : "w-0 bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StateIcon({ state }: { state: Stage["state"] }) {
  if (state === "done")
    return (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-crimson text-white">
        <Check className="size-3" strokeWidth={3} aria-label="Done" />
      </span>
    );
  if (state === "blocked")
    return <AlertTriangle className="size-4 text-crimson" aria-label="Blocked" strokeWidth={2.25} />;
  if (state === "active")
    return <span className="size-3 rounded-full border-[2.5px] border-crimson" aria-label="In progress" />;
  return <span className="size-3 rounded-full border-2 border-line-strong" aria-label="Not started" />;
}
