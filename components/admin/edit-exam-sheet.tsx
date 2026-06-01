"use client";

import { useState } from "react";
import { PencilLine } from "lucide-react";
import type { ExamListItemDTO } from "@/lib/dto/exams";
import type { PlatformDefaults } from "@/lib/types/exam-management";
import { ExamSheetWorkflow } from "@/components/admin/exam-sheet-workflow";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface EditExamSheetProps {
  defaults: PlatformDefaults;
  exam: ExamListItemDTO;
  onUpdated?: (exam: ExamListItemDTO) => void;
  triggerLabel?: string;
}

export function EditExamSheet({
  defaults,
  exam,
  onUpdated,
  triggerLabel = "Edit exam",
}: EditExamSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <PencilLine className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col border-l border-slate-100 bg-white p-0 sm:max-w-4xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Edit exam</SheetTitle>
          <SheetDescription>
            Update the exam details, candidate list, and final setup steps in
            one place.
          </SheetDescription>
        </SheetHeader>

        <ExamSheetWorkflow
          mode="edit"
          defaults={defaults}
          exam={exam}
          onUpdated={onUpdated}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
