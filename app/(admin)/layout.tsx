import { AdminClientLayout } from "@/components/admin/admin-client-layout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdminSession } from "@/lib/auth/server";

export const metadata = {
  title: "ExamProctorLite - Admin",
  description: "Private exam administration workspace",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <TooltipProvider>
      <AdminClientLayout session={session}>{children}</AdminClientLayout>
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
