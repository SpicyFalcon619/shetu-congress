"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar, Badge, Empty, Panel } from "@/components/shared";
import { formatDate, weeksBetween } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { useChanges, useLeave, useReturn } from "@/lib/leave";
import { usePersona } from "@/lib/persona";
import { type StageId, STAGE_ORDER, computeStages, currentStageIndex } from "@/lib/stages";

import { Bridge } from "./bridge";
import { CoverStage } from "./cover-stage";
import { DuringStage } from "./during-stage";
import { MapStage } from "./map-stage";
import { ReturnStage } from "./return-stage";

export function LeaveView({ id }: { id: string }) {
  const { me, ready } = usePersona();
  const leave = useLeave(id, me?.id);
  const changes = useChanges(id, me?.id);
  const ret = useReturn(id, me?.id);
  const [picked, setPicked] = useState<StageId | null>(null);

  if (ready && !me) {
    return (
      <Panel>
        <Empty title="Choose a persona to open this leave">
          Use the menu in the top bar. Rafiq Ahmed is the manager for Nusrat&rsquo;s leave.
        </Empty>
      </Panel>
    );
  }
  if (leave.isError) {
    return (
      <Panel>
        <Empty title={leave.error.message}>
          <Link href="/leaves" className="font-semibold text-crimson underline">
            Back to leaves
          </Link>
        </Empty>
      </Panel>
    );
  }
  if (!leave.data || !me) return <LoadingState />;

  const l = leave.data;
  const stages = computeStages(l, changes.data, ret.data);
  const selected = picked ?? STAGE_ORDER[currentStageIndex(stages)];

  return (
    <div className="grid gap-5 [&>*]:min-w-0">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/leaves" className="font-semibold hover:text-ink">
          Leaves
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-ink-2">{l.employee.name}</span>
      </nav>

      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={l.employee.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl leading-tight font-extrabold tracking-[-0.02em]">{l.employee.name}</h1>
            <Badge tone={l.status === "closed" ? "leaf" : l.status === "planning" ? "gold" : "crimson"}>
              {STATUS_LABEL[l.status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {l.employee.job_title} · {l.employee.organization}
          </p>
        </div>
        <dl className="grid basis-full grid-cols-3 gap-x-6 text-[13px] md:basis-auto">
          <div>
            <dt className="text-2xs font-semibold text-muted-foreground">Leave</dt>
            <dd className="font-semibold">
              {formatDate(l.starts_on)} – {formatDate(l.ends_on)}
            </dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold text-muted-foreground">Length</dt>
            <dd className="font-semibold">{weeksBetween(l.starts_on, l.ends_on)} weeks</dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold text-muted-foreground">Manager</dt>
            <dd className="font-semibold">{l.manager.name}</dd>
          </div>
        </dl>
      </header>

      <Bridge stages={stages} selected={selected} onSelect={setPicked} />

      <div role="tabpanel" id={`panel-${selected}`} aria-labelledby={`tab-${selected}`}>
        {selected === "map" && <MapStage leave={l} me={me} />}
        {selected === "cover" && <CoverStage leave={l} me={me} />}
        {selected === "during" && <DuringStage leave={l} me={me} changes={changes.data ?? []} />}
        {selected === "return" && <ReturnStage leave={l} me={me} view={ret.data} />}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid animate-pulse gap-5" aria-busy="true" aria-label="Loading the leave">
      <div className="h-4 w-40 rounded bg-sunk" />
      <div className="h-12 w-2/3 rounded-lg bg-sunk" />
      <div className="h-44 rounded-xl bg-sunk" />
      <div className="h-72 rounded-xl bg-sunk" />
    </div>
  );
}
