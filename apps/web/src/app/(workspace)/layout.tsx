"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePersona } from "@/lib/persona";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { me, ready, people } = usePersona();
  const router = useRouter();
  const signedOut = ready && people.length > 0 && !me;

  useEffect(() => {
    if (signedOut) router.replace("/sign-in");
  }, [signedOut, router]);

  if (!ready || !me) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <span className="text-[13px] text-muted-foreground">
            {me.organization.replace(" (synthetic)", "")}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft px-2.5 py-0.5 text-2xs font-medium text-gold-ink">
            <span className="size-1.5 rounded-full bg-gold" />
            Synthetic demo data
          </span>
        </header>
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
