"use client";

import clsx from "clsx";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Person } from "@/lib/api/client";

import { Avatar } from "./shared";

const NONE = "__none__";

/** Choose who holds a duty. Styled menu with avatars; "No owner" leaves the duty uncovered. */
export function PersonSelect({
  value,
  people,
  onChange,
  label,
  invalid,
  hours,
}: {
  value: string | null;
  people: Person[];
  onChange: (id: string | null) => void;
  label: string;
  invalid?: boolean;
  hours?: Map<string, { used: number; cap?: number }>;
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger
        aria-label={label}
        size="sm"
        className={clsx(
          "w-48 bg-card text-[13px] font-medium",
          invalid && "border-crimson text-crimson-ink ring-1 ring-crimson/20",
        )}
      >
        <SelectValue placeholder="No owner" />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-60">
        <SelectItem value={NONE} className="text-muted-foreground">
          No owner
        </SelectItem>
        {people.map((p) => {
          const h = hours?.get(p.id);
          return (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex w-full items-center gap-2">
                <Avatar name={p.name} size="sm" />
                <span className="flex-1">{p.name}</span>
                {h?.cap !== undefined && (
                  <span
                    className={clsx(
                      "text-2xs tabular-nums",
                      h.used > h.cap ? "text-crimson-ink" : "text-muted-foreground",
                    )}
                  >
                    {h.used}/{h.cap} h
                  </span>
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
