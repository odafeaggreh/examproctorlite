"use client";

import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDotDashed,
  FileSpreadsheet,
  ListChecks,
  Loader2,
  Plus,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format/date";
import type { ExamListItemDTO } from "@/lib/dto/exams";
import type {
  ExamAssignmentSummary,
  PlatformDefaults,
  StudentGroupRecord,
} from "@/lib/types/exam-management";

type CandidateRow = {
  id: string;
  name: string;
  email: string;
};

type CandidateGroupForm = {
  name: string;
  description: string;
  candidates: CandidateRow[];
};

function StepBadge({
  status,
}: {
  status: "complete" | "next" | "pending";
}) {
  if (status === "complete") {
    return <Badge variant="success">Complete</Badge>;
  }

  if (status === "next") {
    return <Badge variant="warning">Next</Badge>;
  }

  return <Badge variant="outline">Pending</Badge>;
}

function createCandidateRow(values?: Partial<CandidateRow>): CandidateRow {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: values?.name ?? "",
    email: values?.email ?? "",
  };
}

function buildCsvFromCandidates(candidates: CandidateRow[]) {
  const rows = candidates
    .filter((candidate) => candidate.email.trim())
    .map((candidate) => {
      const safeName = candidate.name.replaceAll('"', '""');
      const safeEmail = candidate.email.replaceAll('"', '""');
      return `"${safeName}","${safeEmail}"`;
    });

  return ["name,email", ...rows].join("\n");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCandidatesFromCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine).map((header) =>
    header.trim().toLowerCase(),
  );
  const emailIndex = headers.findIndex((header) => header === "email");
  const nameIndex = headers.findIndex(
    (header) => header === "name" || header === "full name",
  );

  if (emailIndex === -1) {
    throw new Error("The CSV file needs an email column.");
  }

  return dataLines.map((line) => {
    const columns = parseCsvLine(line);
    return createCandidateRow({
      name: nameIndex >= 0 ? columns[nameIndex] ?? "" : "",
      email: columns[emailIndex] ?? "",
    });
  });
}

function candidateCount(candidates: CandidateRow[]) {
  return candidates.filter((candidate) => candidate.email.trim()).length;
}

function updateCandidateInList(
  candidates: CandidateRow[],
  candidateId: string,
  field: "name" | "email",
  value: string,
) {
  return candidates.map((candidate) =>
    candidate.id === candidateId ? { ...candidate, [field]: value } : candidate,
  );
}

function CandidateRowsEditor({
  candidates,
  onChange,
}: {
  candidates: CandidateRow[];
  onChange: (candidates: CandidateRow[]) => void;
}) {
  function addCandidate() {
    onChange([...candidates, createCandidateRow()]);
  }

  return (
    <div className="space-y-3">
      {candidates.map((candidate, index) => (
        <div
          key={candidate.id}
          className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Candidate name
            </label>
            <Input
              value={candidate.name}
              onChange={(event) =>
                onChange(
                  updateCandidateInList(
                    candidates,
                    candidate.id,
                    "name",
                    event.target.value,
                  ),
                )
              }
              placeholder={`Candidate ${index + 1}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <Input
              value={candidate.email}
              onChange={(event) =>
                onChange(
                  updateCandidateInList(
                    candidates,
                    candidate.id,
                    "email",
                    event.target.value,
                  ),
                )
              }
              placeholder="candidate@example.com"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCandidate}
        className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Plus className="h-4 w-4 text-slate-500" />
        Add candidate
      </button>
    </div>
  );
}

export function ExamSetupWorkspace({
  defaults,
  initialExam,
  initialGroups,
  initialSummary,
}: {
  defaults: PlatformDefaults;
  initialExam: ExamListItemDTO;
  initialGroups: StudentGroupRecord[];
  initialSummary: ExamAssignmentSummary;
}) {
  const [exam] = useState(initialExam);
  const [summary, setSummary] = useState(initialSummary);
  const [showStepOneReview, setShowStepOneReview] = useState(false);
  const [stepTwoError, setStepTwoError] = useState<string | null>(null);
  const [stepTwoSuccessVisible, setStepTwoSuccessVisible] = useState(false);
  const [isSavingStepTwo, startSavingStepTwo] = useTransition();
  const [isCreatingGroup, startCreatingGroup] = useTransition();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [manualGroupOpen, setManualGroupOpen] = useState(
    initialGroups.length > 0 || initialSummary.selectedGroupCount > 0,
  );
  const [uploadForm, setUploadForm] = useState<CandidateGroupForm>({
    name: "",
    description: "",
    candidates: [createCandidateRow()],
  });
  const [manualForm, setManualForm] = useState<CandidateGroupForm>({
    name: "",
    description: "",
    candidates: [createCandidateRow()],
  });

  const steps = [
    {
      title: "Exam setup",
      description:
        "Basic exam details, schedule, and scoring are already in place.",
      icon: CheckCircle2,
      status: "complete" as const,
    },
    {
      title: "Who can take this exam",
      description: summary.isStepComplete
        ? "Candidate access is ready and a shared code has been prepared."
        : "Add candidates, organise them, and generate one shared access code.",
      icon: UsersRound,
      status: summary.isStepComplete ? ("complete" as const) : ("next" as const),
    },
    {
      title: "Select questions",
      description:
        "Question selection comes next, once candidate access is ready.",
      icon: ListChecks,
      status: "pending" as const,
    },
  ];

  const uploadCandidateCount = useMemo(
    () => candidateCount(uploadForm.candidates),
    [uploadForm.candidates],
  );
  const manualCandidateCount = useMemo(
    () => candidateCount(manualForm.candidates),
    [manualForm.candidates],
  );

  async function refreshSummary() {
    const response = await fetch(`/api/admin/exams/${exam.id}/assignment-summary`);
    const payload = (await response.json()) as {
      summary?: ExamAssignmentSummary;
      error?: string;
    };

    if (!response.ok || !payload.summary) {
      throw new Error(payload.error ?? "Could not refresh candidate setup.");
    }

    setSummary(payload.summary);
    return payload.summary;
  }

  async function persistCandidateGroup(form: CandidateGroupForm) {
    const validCandidates = form.candidates.filter((candidate) =>
      candidate.email.trim(),
    );

    if (!form.name.trim()) {
      throw new Error("Enter a group name before saving.");
    }

    if (validCandidates.length === 0) {
      throw new Error("Add at least one candidate before saving.");
    }

    const createGroupResponse = await fetch("/api/admin/student-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        memberEmails: validCandidates.map((candidate) => candidate.email.trim()),
      }),
    });

    const createGroupPayload = (await createGroupResponse.json()) as {
      group?: StudentGroupRecord;
      error?: string;
    };

    if (!createGroupResponse.ok || !createGroupPayload.group) {
      throw new Error(createGroupPayload.error ?? "Could not save the group.");
    }

    const csvText = buildCsvFromCandidates(validCandidates);

    const importResponse = await fetch(
      `/api/admin/exams/${exam.id}/assignments/import`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText,
          previewOnly: false,
        }),
      },
    );

    const importPayload = (await importResponse.json()) as { error?: string };

    if (!importResponse.ok) {
      throw new Error(importPayload.error ?? "Could not add the candidates.");
    }

    const attachResponse = await fetch(
      `/api/admin/exams/${exam.id}/assignments/groups`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupIds: [createGroupPayload.group.id],
        }),
      },
    );

    const attachPayload = (await attachResponse.json()) as { error?: string };

    if (!attachResponse.ok) {
      throw new Error(
        attachPayload.error ?? "Could not link the saved candidates to this exam.",
      );
    }

    const codeResponse = await fetch(`/api/admin/exams/${exam.id}/access-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maxUses: exam.maxAccessCodeUses || defaults.defaultAccessCodeMaxUses,
        expiresInDays: defaults.defaultAccessCodeExpiryDays,
      }),
    });

    const codePayload = (await codeResponse.json()) as { error?: string };

    if (!codeResponse.ok) {
      throw new Error(
        codePayload.error ?? "Could not generate the shared access code.",
      );
    }

    await refreshSummary();
    setStepTwoSuccessVisible(true);
  }

  function resetUploadForm() {
    setUploadForm({
      name: "",
      description: "",
      candidates: [createCandidateRow()],
    });
    setUploadFileName("");
  }

  function resetManualForm() {
    setManualForm({
      name: "",
      description: "",
      candidates: [createCandidateRow()],
    });
  }

  async function handleCsvFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setUploadFileName("");
      return;
    }

    try {
      const text = await file.text();
      const parsedCandidates = parseCandidatesFromCsv(text);

      setUploadFileName(file.name);
      setUploadForm((current) => ({
        ...current,
        candidates:
          parsedCandidates.length > 0
            ? parsedCandidates
            : [createCandidateRow()],
      }));
      setStepTwoError(null);
    } catch (error) {
      setStepTwoError(
        error instanceof Error ? error.message : "Could not read the CSV file.",
      );
    }
  }

  async function handleSaveUploadDialog() {
    setStepTwoError(null);

    startSavingStepTwo(async () => {
      try {
        await persistCandidateGroup(uploadForm);
        setUploadDialogOpen(false);
      } catch (error) {
        setStepTwoError(
          error instanceof Error
            ? error.message
            : "Could not save candidates from the CSV file.",
        );
      }
    });
  }

  async function handleSaveManualCandidates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStepTwoError(null);

    startCreatingGroup(async () => {
      try {
        await persistCandidateGroup(manualForm);
      } catch (error) {
        setStepTwoError(
          error instanceof Error
            ? error.message
            : "Could not save the candidate list.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(next) => {
          setUploadDialogOpen(next);
          if (!next) {
            resetUploadForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl rounded-[28px] p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-slate-900">
              Upload candidates from a CSV file
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Add a group name first, then upload your CSV file. You can still
              review the list and add more candidates before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto bg-slate-50/50 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Group name
                </label>
                <Input
                  value={uploadForm.name}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. May intake candidates"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <Input
                  value={uploadForm.description}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional note for your team"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Upload CSV file
                </label>
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                />
                <p className="text-xs text-slate-500">
                  {uploadFileName
                    ? `Loaded file: ${uploadFileName}`
                    : "Your CSV should include an email column. A name column is helpful too."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Candidate list
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review the imported rows and add anyone who is missing before
                  you save.
                </p>
              </div>
              <CandidateRowsEditor
                candidates={uploadForm.candidates}
                onChange={(candidates) =>
                  setUploadForm((current) => ({ ...current, candidates }))
                }
              />
            </div>
          </div>

          <DialogFooter className="items-center justify-between bg-white px-6 py-4">
            <p className="text-sm text-slate-500">
              {uploadCandidateCount} candidate
              {uploadCandidateCount === 1 ? "" : "s"} ready for this group
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={resetUploadForm}>
                Reset
              </Button>
              <Button
                type="button"
                className="gap-2 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700"
                onClick={handleSaveUploadDialog}
                disabled={isSavingStepTwo}
              >
                {isSavingStepTwo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving candidates
                  </>
                ) : (
                  <>
                    Save candidates
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button asChild className="w-fit gap-2" variant="ghost">
            <Link href="/admin/exams">
              <ArrowLeft className="h-4 w-4" />
              Back to exams
            </Link>
          </Button>
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Exam setup</Badge>
              <Badge variant={exam.status === "published" ? "success" : "warning"}>
                {exam.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {exam.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Add the candidates for this exam, then move on to selecting the
              questions.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" className="gap-2">
          <Link href={`/admin/exams/${exam.id}/edit`}>
            Edit exam details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <Card
              key={step.title}
              className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <StepBadge status={step.status} />
                </div>
                <div>
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Step {index + 1}
                  </CardDescription>
                  <CardTitle className="mt-2 text-[1.1rem] text-slate-900">
                    {step.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-500">
                {step.description}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Step 1 review
            </CardDescription>
            <CardTitle className="mt-2 text-[1.1rem] text-slate-900">
              Exam details
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-slate-500">
              Review the exam details here if you need a quick reminder before
              you continue.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowStepOneReview((current) => !current)}
          >
            {showStepOneReview ? "Hide exam details" : "Review exam details"}
          </Button>
        </CardHeader>
        {showStepOneReview ? (
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Overview</h3>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Exam title
                  </dt>
                  <dd className="mt-1 text-slate-900">{exam.title}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Description
                  </dt>
                  <dd className="mt-1">
                    {exam.description || "No description added yet."}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Instructions
                  </dt>
                  <dd className="mt-1">
                    {exam.instructions || "No instructions added yet."}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Schedule</h3>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Opens
                  </dt>
                  <dd className="mt-1 text-slate-900">
                    {formatDateTime(exam.startAt) || "Not scheduled"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Closes
                  </dt>
                  <dd className="mt-1 text-slate-900">
                    {formatDateTime(exam.endAt) || "No closing time added yet."}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Duration
                  </dt>
                  <dd className="mt-1">{exam.durationMinutes} minutes</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Step 2
            </CardDescription>
            <CardTitle className="text-[1.25rem] text-slate-900">
              Choose how you want to add candidates
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              You can upload a CSV file or build a saved candidate list by hand.
              Once you save either option, one shared access code will be created
              for this exam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setUploadDialogOpen(true)}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Upload CSV
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Open a dialog, upload your file, and review the candidates
                      before you save them.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setManualGroupOpen((current) => !current)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  manualGroupOpen
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <UsersRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Use previous candidates
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Reveal a candidate list builder so you can create and save
                      a reusable group by hand.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {manualGroupOpen ? (
              <form
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                onSubmit={handleSaveManualCandidates}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Use previous candidates
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Name this candidate list, then add each person you want to
                      include in this exam.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {manualCandidateCount} candidate
                    {manualCandidateCount === 1 ? "" : "s"}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Group name
                    </label>
                    <Input
                      value={manualForm.name}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Returning candidates"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <Input
                      value={manualForm.description}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Optional note for your team"
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Candidate list
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Add the names and email addresses for everyone who should
                      receive this exam code.
                    </p>
                  </div>
                  <CandidateRowsEditor
                    candidates={manualForm.candidates}
                    onChange={(candidates) =>
                      setManualForm((current) => ({ ...current, candidates }))
                    }
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="submit"
                    className="gap-2 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700"
                    disabled={isCreatingGroup}
                  >
                    {isCreatingGroup ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving candidates
                      </>
                    ) : (
                      <>
                        Save candidates
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : null}

            {stepTwoError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-red-700">
                {stepTwoError}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
            <CardHeader>
              <CardTitle className="text-[1.1rem] text-slate-900">
                Candidate summary
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                This updates after you save your candidate list. The exam code
                is created when the exam is created.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Candidates linked to this exam
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {summary.totalReachableCandidates}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Saved groups linked
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {summary.selectedGroupCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {summary.selectedGroupNames.length > 0
                    ? summary.selectedGroupNames.join(", ")
                    : "No saved candidate group linked yet"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Shared exam code
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {summary.sharedAccessCode?.code || "No code generated yet"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {summary.hasSharedAccessCode
                    ? "A shared code is ready to copy and share with candidates."
                    : "No shared code exists yet. Create a fresh exam to generate one automatically."}
                </p>
              </div>
            </CardContent>
          </Card>

          {stepTwoSuccessVisible ? (
            <Card className="rounded-[24px] border-blue-100 bg-blue-50/70 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-[1.1rem] text-slate-900">
                  Candidates saved successfully
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  Your candidates have been added. Use the shared access code to
                  help them attach their accounts to this exam.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                  <p className="text-sm text-slate-600">
                    Step 2 is complete. The next step is choosing the questions
                    for this exam.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" asChild>
                    <a href="#step-3">
                      Continue to questions
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card
            id="step-3"
            className="rounded-[24px] border-dashed border-slate-200 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]"
          >
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <CircleDotDashed className="h-5 w-5" />
              </div>
              <CardTitle className="text-[1.1rem] text-slate-900">
                Step 3 is next
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Once your candidate list is ready, the next step is choosing the
                questions for this exam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                {summary.isStepComplete
                  ? "Step 2 is complete. You can move on to choosing questions."
                  : "Save your candidate list first so the next step starts from a complete setup."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
