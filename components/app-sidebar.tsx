"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebaseConfig";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Shield,
  ChevronsUpDown,
  Settings,
  LogOut,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { AuthenticatedSession } from "@/lib/types/exam-management";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: AuthenticatedSession;
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();

  async function handleLogout() {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to clear session cookie", error);
    }
    await signOut(auth);
    router.replace("/login");
    router.refresh();
  }

  const primaryNav = [
    {
      href: "/admin",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/exams",
      label: "Exams",
      icon: FileText,
    },
    {
      href: "/admin/students",
      label: "Students",
      icon: Users,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: BarChart3,
    },
  ];

  const secondaryNav = [
    {
      href: "/admin/manage-admins",
      label: "Admins",
      icon: Shield,
    },
    {
      href: "/admin/guides",
      label: "Guides",
      icon: BookOpen,
    },
  ];

  // Get initials for profile picture placeholder
  const displayName = session?.name ?? session?.email ?? "Admin";
  const initials =
    displayName
      .split("@")[0] // Avoid taking domain initials if it's an email
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";

  return (
    <Sidebar
      className="border-r border-slate-200 bg-white"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader
        className={cn(
          "flex h-[60px] flex-row items-center border-b border-slate-200 bg-white px-4",
          state === "collapsed" && !isMobile ? "justify-center px-2" : "",
        )}
      >
        <Link
          href="/admin"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 overflow-hidden select-none",
            state === "collapsed" && !isMobile && "hidden",
          )}
        >
          <span
            className={cn(
              "font-semibold text-base tracking-tight text-slate-900",
              state === "collapsed" && !isMobile && "hidden",
            )}
          >
            ExamProctorlite
          </span>
          <span
            className={cn(
              "hidden font-semibold text-base tracking-tight text-slate-900",
              state === "collapsed" && !isMobile && "inline",
            )}
          >
            E
          </span>
        </Link>
        <SidebarTrigger
          className={cn(
            "shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            state !== "collapsed" || isMobile ? "ml-2" : "mx-auto",
          )}
        />
      </SidebarHeader>

      <SidebarContent className="bg-white px-3 py-4">
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupLabel className="px-3 uppercase tracking-[0.08em] text-slate-400 group-data-[collapsible=icon]:hidden">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
                        isActive
                          ? "bg-blue-50/50 font-semibold text-blue-600"
                          : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0",
                            isActive ? "text-blue-600" : "text-slate-500",
                          )}
                        />
                        <span className="text-sm group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6 px-0 py-0">
          <SidebarGroupLabel className="px-3 uppercase tracking-[0.08em] text-slate-400 group-data-[collapsible=icon]:hidden">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-xl px-3 transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
                        isActive
                          ? "bg-blue-50/50 font-semibold text-blue-600"
                          : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0",
                            isActive ? "text-blue-600" : "text-slate-500",
                          )}
                        />
                        <span className="text-sm group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-slate-200 bg-white p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/50 p-3 text-left outline-none transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 cursor-pointer",
                state === "collapsed" && !isMobile && "justify-center px-2",
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-sm text-white shadow-xs">
                {initials}
              </div>
              <div
                className={cn(
                  "flex flex-1 flex-col overflow-hidden leading-tight",
                  state === "collapsed" && !isMobile && "hidden",
                )}
              >
                <span className="truncate text-sm font-semibold text-slate-800">
                  {session?.name ?? "Admin Panel"}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {session?.email}
                </span>
              </div>
              <ChevronsUpDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400",
                  state === "collapsed" && !isMobile && "hidden",
                )}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-[240px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/80 focus:outline-none"
          >
            <DropdownMenuItem
              asChild
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors duration-150"
            >
              <Link href="/admin/manage-admins">
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/5 hover:text-destructive cursor-pointer transition-colors duration-150"
            >
              <LogOut className="h-4 w-4 text-destructive/80" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
