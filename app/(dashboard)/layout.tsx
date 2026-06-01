import { AuthProvider } from "../contexts/AuthContext";
import { requireAuthenticatedSession } from "@/lib/auth/server";

export const metadata = {
  title: "ExamProctorLite - Dashboard",
  description: "Candidate workspace",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedSession();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-muted/30">
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
