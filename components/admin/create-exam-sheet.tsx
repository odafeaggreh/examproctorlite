"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
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

interface CreateExamSheetProps {
  defaults: PlatformDefaults;
  onCreated: (exam: ExamListItemDTO) => void;
}

export function CreateExamSheet({ defaults, onCreated }: CreateExamSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Sparkles className="h-4 w-4" />
          Create exam
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col border-l border-slate-100 bg-white p-0 sm:max-w-4xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Create exam</SheetTitle>
          <SheetDescription>
            Set up the exam details, choose who can take it, and save everything
            together.
          </SheetDescription>
        </SheetHeader>

        <ExamSheetWorkflow
          mode="create"
          defaults={defaults}
          onCreated={onCreated}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
