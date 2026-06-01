import Link from "next/link";
import { ArrowRight, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const cards = [
  {
    title: "Exams workspace",
    description:
      "Create, schedule, and share multiple exams with defaults, access codes, and controlled result release.",
    href: "/admin/exams",
    icon: ClipboardList,
  },
  {
    title: "Students",
    description:
      "Import student rosters, manage exam mappings, and prepare candidate-level reporting.",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "Authorization",
    description:
      "Custom claims and server-side checks are now the source of truth for admin access.",
    href: "/admin/manage-admins",
    icon: ShieldCheck,
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform overview
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          The new admin rebuild is now centered on secure session checks, a
          shared data access layer, DTOs for safe data exposure, and multi-exam
          management as the core operating model.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.href}>
              <CardHeader>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="gap-2" variant="outline">
                  <Link href={card.href}>
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
