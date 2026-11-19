"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { orgsOf, sortPeople } from "@/components/account-switcher";
import { ArchLogo } from "@/components/arch-logo";
import { Avatar } from "@/components/shared";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ROLE_LABEL } from "@/lib/labels";
import { usePersona } from "@/lib/persona";

const SUGGESTED = ["rafiq", "nusrat", "farzana"];

export default function SignInPage() {
  const { people, choose } = usePersona();
  const router = useRouter();
  const enter = (id: string) => {
    choose(id);
    router.push("/");
  };
  const suggested = SUGGESTED.map((id) => people.find((p) => p.id === id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-crimson-deep p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <ArchLogo onDark className="h-7 w-auto" />
          <span className="text-lg font-semibold">
            Shetu <span className="font-bangla text-rose">সেতু</span>
          </span>
        </div>
        <div className="max-w-md">
          <p className="text-[40px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">
            Map her job. Hold her role. <span className="text-rose">Guard her return.</span>
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/75">
            Shetu keeps a job safe while its owner is on leave. It finds the work nobody wrote down, checks
            every cover plan against clear rules, and makes sure nothing moves for good without her agreement.
          </p>
        </div>
        <ArchLogo
          onDark
          className="pointer-events-none absolute -right-24 -bottom-10 h-auto w-[34rem] opacity-[0.07]"
        />
        <p className="text-xs text-white/60">
          Built for maternity leave. Works for any planned leave, and never asks why.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <ArchLogo className="h-6 w-auto" />
            <span className="text-lg font-semibold">Shetu</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Sign in to the demo workspace</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Choose a demo account. Each one sees only what their role allows, and every permission is checked
            on the server.
          </p>

          {suggested.length > 0 && (
            <div className="mt-6 grid gap-2">
              {suggested.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => enter(p.id)}
                  className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-[0_1px_2px_rgba(34,32,35,0.04)] transition-colors hover:border-crimson/40 hover:bg-blush/30"
                >
                  <Avatar name={p.name} />
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="text-[14px] font-semibold">{p.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {ROLE_LABEL[p.role]} · {p.job_title}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-crimson" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 text-2xs font-medium text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or any other account
            <span className="h-px flex-1 bg-border" />
          </div>

          <Command className="mt-4 rounded-xl border bg-card shadow-[0_1px_2px_rgba(34,32,35,0.04)]">
            <CommandInput placeholder="Search people" />
            <CommandList className="max-h-72">
              <CommandEmpty>No one by that name.</CommandEmpty>
              {orgsOf(people).map((org) => (
                <CommandGroup key={org} heading={org}>
                  {sortPeople(people.filter((p) => p.organization === org)).map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${p.name} ${ROLE_LABEL[p.role]} ${p.job_title} ${org}`}
                      onSelect={() => enter(p.id)}
                      className="gap-2.5"
                    >
                      <Avatar name={p.name} size="sm" />
                      <span className="flex-1 truncate text-[13px] font-medium">{p.name}</span>
                      <span className="text-2xs text-muted-foreground">{ROLE_LABEL[p.role]}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
          <p className="mt-6 text-center text-2xs text-muted-foreground">
            Synthetic demo data. Every person and organization here is invented.
          </p>
        </div>
      </main>
    </div>
  );
}
