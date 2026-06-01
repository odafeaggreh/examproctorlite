"use client";

import { useState } from "react";
import { useAdmin } from "@/app/contexts/AdminContext";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const { isSuperAdmin } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div>
      <button className="md:hidden p-4" onClick={() => setIsOpen(!isOpen)}>
        <Menu className="h-6 w-6" />
      </button>
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out w-64 z-50`}
      >
        <div className="flex justify-between items-center p-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <button className="md:hidden" onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-2">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium ${
              isActive("/admin")
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>

          {isSuperAdmin && (
            <Link
              href="/admin/manage-admins"
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium ${
                isActive("/admin/manage-admins")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-5 w-5" />
              Manage Admins
            </Link>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/logout");
            }}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
}
