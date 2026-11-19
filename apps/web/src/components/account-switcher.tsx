"use client";

import { Check, ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { Person } from "@/lib/api/client";
import { ROLE_LABEL } from "@/lib/labels";
import { usePersona } from "@/lib/persona";

import { Avatar } from "./shared";

const ROLE_ORDER = ["manager", "employee", "hr", "cover"];

export function sortPeople(people: Person[]) {
  return [...people].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name),
  );
}

export function orgsOf(people: Person[]) {
  return [...new Set(people.map((p) => p.organization))].sort(
    (a, b) => Number(b.startsWith("Shapla")) - Number(a.startsWith("Shapla")),
  );
}

/** The account menu in the sidebar footer: switch demo account, grouped by organization. */
export function AccountSwitcher() {
  const { me, people, choose } = usePersona();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!me) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
          <Avatar name={me.name} />
          <span className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate text-[13px] font-semibold text-foreground">{me.name}</span>
            <span className="truncate text-xs text-muted-foreground">{ROLE_LABEL[me.role]}</span>
          </span>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-0" sideOffset={8}>
        <Command>
          <CommandInput placeholder="Switch to…" />
          <CommandList className="max-h-80">
            <CommandEmpty>No one by that name.</CommandEmpty>
            {orgsOf(people).map((org) => (
              <CommandGroup key={org} heading={org.replace(" (synthetic)", "")}>
                {sortPeople(people.filter((p) => p.organization === org)).map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${ROLE_LABEL[p.role]} ${p.job_title}`}
                    onSelect={() => {
                      choose(p.id);
                      setOpen(false);
                      router.push("/");
                    }}
                    className="gap-2.5"
                  >
                    <Avatar name={p.name} size="sm" />
                    <span className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-[13px] font-medium">{p.name}</span>
                      <span className="truncate text-2xs text-muted-foreground">{ROLE_LABEL[p.role]}</span>
                    </span>
                    {p.id === me.id && <Check className="size-4 text-crimson" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  choose(null);
                  setOpen(false);
                  router.push("/sign-in");
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
