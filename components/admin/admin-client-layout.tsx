"use client";

import { PanelLeftIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { AuthenticatedSession } from "@/lib/types/exam-management";

function MobileSidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="sticky top-0 z-10 flex h-16 items-center justify-start border-b border-slate-200 bg-white px-4 md:hidden">
      <Button
        className="h-10 w-10 text-slate-600"
        onClick={toggleSidebar}
        size="icon"
        type="button"
        variant="ghost"
      >
        <PanelLeftIcon className="h-4 w-4" />
        <span className="sr-only">Open sidebar</span>
      </Button>
    </div>
  );
}

export function AdminClientLayout({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AuthenticatedSession;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar session={session} />
        <SidebarInset className="min-w-0 overflow-x-hidden bg-slate-50/80">
          <MobileSidebarToggle />
          <div className="flex min-w-0 max-w-full flex-1 flex-col gap-6 overflow-x-hidden p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
