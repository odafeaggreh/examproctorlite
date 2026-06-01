import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentResultPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Student attempt workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Candidate review will be rebuilt around exam attempts, manual-review
          states, and result release controls.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attempt detail scaffold</CardTitle>
          <CardDescription>
            Student ID: {studentId}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is reserved for the new attempt review flow. We will replace
          the old per-user exam history view with attempt-based grading and
          release controls.
        </CardContent>
      </Card>
    </div>
  );
}
