"use client";

import { CalendarRange, LayoutDashboard, ScrollText, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { usePersona } from "@/lib/persona";

import { AccountSwitcher } from "./account-switcher";
import { ArchLogo } from "./arch-logo";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/leaves", label: "Leaves", icon: CalendarRange },
  { href: "/people", label: "People", icon: Users },
  { href: "/audit", label: "Audit log", icon: ScrollText },
];

function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Nav({ pathname }: { pathname: string | null }) {
  return (
    <SidebarMenu>
      {NAV.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            asChild
            isActive={isActive(pathname, href)}
            tooltip={label}
            className="data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-foreground [&[data-active=true]>svg]:text-crimson"
          >
            <Link href={href}>
              <Icon />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function CurrentNav() {
  return <Nav pathname={usePathname()} />;
}

export function AppSidebar() {
  const { me } = usePersona();
  const org = me?.organization.replace(" (synthetic)", "") ?? "";
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-crimson">
                  <ArchLogo onDark className="h-3.5 w-auto" />
                </span>
                <span className="grid leading-tight">
                  <span className="text-[14px] font-semibold text-foreground">
                    Shetu <span className="font-bangla font-semibold text-crimson">সেতু</span>
                  </span>
                  <span className="truncate text-2xs text-muted-foreground">{org}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <Suspense fallback={<Nav pathname={null} />}>
              <CurrentNav />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="size-3.5 text-leaf" />
              How Shetu decides
            </p>
            AI proposes, rules check, people decide. Shetu never asks why someone is away and never ranks
            people.
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AccountSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
