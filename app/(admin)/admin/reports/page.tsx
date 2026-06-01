import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Platform-level, exam-level, and student-level reporting will land
          here once the multi-exam data model is fully in place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics placeholder</CardTitle>
          <CardDescription>
            Pass rates, averages, question statistics, and pending manual review
            counts will use DTO-backed report queries from the new data layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is intentionally lightweight for now so we can build the
          reporting queries after attempts and grading are migrated.
        </CardContent>
      </Card>
    </div>
  );
}
