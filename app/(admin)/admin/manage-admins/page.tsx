import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManageAdminsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Manage admins
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Custom-claim role management is wired on the backend. The next step is
          connecting this page to the new claims-backed admin management UI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claims-backed authorization</CardTitle>
          <CardDescription>
            Super admin role changes should update both Firebase custom claims
            and the user profile document, with an audit log entry for every
            change.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This route is now protected server-side. We will attach the new
          Shadcn table and Sheet workflow here when we build the role management
          module.
        </CardContent>
      </Card>
    </div>
  );
}
