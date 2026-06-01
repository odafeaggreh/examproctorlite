import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminStudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This module will handle CSV imports, exam assignments, access-code
          redemption tracking, and student-level reporting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster management</CardTitle>
          <CardDescription>
            Import students by CSV or attach exams through redeemed access
            codes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The student-management surface is scaffolded so the admin navigation
          and protected routes stay stable while we build the actual roster
          tools.
        </CardContent>
      </Card>
    </div>
  );
}
