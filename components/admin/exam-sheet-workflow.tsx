"use client";

import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Copy,
  ListChecks,
  Loader2,
  Mail,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { ExamListItemDTO } from "@/lib/dto/exams";
import type {
  ExamStatus,
  GradingMode,
  PlatformDefaults,
  QuestionFeedbackRecord,
  QuestionOptionRecord,
  QuestionType,
  ResultReleaseMode,
} from "@/lib/types/exam-management";
import {
  CreateQuestionBlock,
  QUESTION_TYPE_LABELS,
  createQuestionDraft,
  createQuestionDraftFromBankItem,
  normalizeQuestionDraft,
  validateQuestionDraft,
  type CreateQuestionDraft,
  type NormalizedQuestionDraft,
} from "@/components/admin/create-question-block";
import {
  ExamScheduleCard,
  type DateTimeValue,
} from "@/components/admin/exam-schedule-card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SheetMode = "create" | "edit";

type QuestionBankItem = {
  id: string;
  sourceQuestionId?: string;
  title: string;
  required: boolean;
  type: QuestionType;
  options: QuestionOptionRecord[];
  points: number;
  correctAnswer?: string;
  feedback?: QuestionFeedbackRecord;
};

interface ExamSheetWorkflowProps {
  mode: SheetMode;
  defaults: PlatformDefaults;
  exam?: ExamListItemDTO;
  initialQuestions?: QuestionBankItem[];
  onCreated?: (exam: ExamListItemDTO) => void;
  onUpdated?: (exam: ExamListItemDTO) => void;
  onClose?: () => void;
}

type ExamQuestionPayload = {
  sourceQuestionId?: string;
  title: string;
  required: boolean;
  type: QuestionType;
  options: QuestionOptionRecord[];
  points: number;
  correctAnswer?: string;
  feedback?: QuestionFeedbackRecord;
};

type CreatedExamAccessCode = {
  code: string;
};

const SELECT_TRIGGER_CLASS =
  "h-10 w-full rounded-xl border-slate-200 bg-white px-3";
const SELECT_CONTENT_CLASS = "p-1";
const SELECT_ITEM_CLASS = "rounded-md py-2";
const ACCESS_CODE_COPIED_RESET_MS = 5 * 1000;
const VISIBLE_EMAIL_CHIP_COUNT = 5;
const EMAIL_SPLIT_PATTERN = /[\s,;]+/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toISOTimestamp(dt: DateTimeValue): string | null {
  if (!dt.date) {
    return null;
  }

  const [hours, minutes] = dt.time.split(":").map(Number);
  const value = new Date(dt.date);
  value.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return value.toISOString();
}

function normalizeEmailInput(value: string) {
  return value.trim().toLowerCase();
}

function splitEmailInput(value: string) {
  return value
    .split(EMAIL_SPLIT_PATTERN)
    .map(normalizeEmailInput)
    .filter(Boolean);
}

function fromISOTimestamp(iso: string | null): DateTimeValue {
  if (!iso) {
    return { date: undefined, time: "00:00" };
  }

  const value = new Date(iso);
  return {
    date: value,
    time: `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`,
  };
}

function createDefaultDateTime(baseDate = new Date()): DateTimeValue {
  const next = new Date(baseDate);
  next.setSeconds(0, 0);

  const minutes = next.getMinutes();
  const roundedMinutes = minutes === 0 ? 0 : Math.ceil(minutes / 15) * 15;

  if (roundedMinutes === 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  } else {
    next.setMinutes(roundedMinutes, 0, 0);
  }

  return {
    date: next,
    time: `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`,
  };
}

function shiftDateTime(
  value: DateTimeValue,
  minutesToAdd: number,
): DateTimeValue {
  const iso = toISOTimestamp(value);

  if (!iso) {
    return createDefaultDateTime();
  }

  const next = new Date(iso);
  next.setMinutes(next.getMinutes() + minutesToAdd);

  return {
    date: next,
    time: `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`,
  };
}

function formatDurationLabel(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function resolveUserTimezone(fallback: string) {
  if (typeof Intl === "undefined") {
    return fallback;
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
}

function listSupportedTimezones(fallback: string) {
  if (
    typeof Intl !== "undefined" &&
    typeof Intl.supportedValuesOf === "function"
  ) {
    const zones = Intl.supportedValuesOf("timeZone");
    return zones.length > 0 ? zones : [fallback];
  }

  return [fallback];
}

function HelpTooltip({
  label,
  children,
  iconClassName = "h-3.5 w-3.5",
}: {
  label: string;
  children: React.ReactNode;
  iconClassName?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-slate-400 transition-colors hover:text-slate-700"
          aria-label={label}
        >
          <CircleHelp className={iconClassName} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72 text-xs">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

function GroupHeading({
  title,
  description,
}: {
  title: string;
  description?: string | null;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold tracking-[-0.01em] text-slate-900">
        {title}
      </h3>
      {description ? (
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function FieldWrapper({
  id,
  label,
  hint,
  tooltip,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  const helpText =
    tooltip && hint ? (
      <>
        {tooltip}
        <br />
        {hint}
      </>
    ) : (
      (tooltip ?? hint)
    );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </Label>
        {helpText ? (
          <HelpTooltip label={`Help for ${label}`}>{helpText}</HelpTooltip>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function QuestionMetaBadges({
  question,
  showOptionCount = false,
}: {
  question: QuestionBankItem;
  showOptionCount?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <Badge variant="outline">{QUESTION_TYPE_LABELS[question.type]}</Badge>
      <Badge variant="secondary">
        {question.points} pt{question.points === 1 ? "" : "s"}
      </Badge>
      {showOptionCount && question.options?.length ? (
        <span>
          {question.options.length} option
          {question.options.length === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}

async function fetchQuestionBank() {
  const response = await fetch("/api/admin/questions");
  const payload = (await response.json()) as {
    questions?: QuestionBankItem[];
    error?: string;
  };

  if (!response.ok || !payload.questions) {
    throw new Error(payload.error ?? "Could not load the question bank.");
  }

  return payload.questions;
}

async function createQuestionBankItem(
  question: NormalizedQuestionDraft,
): Promise<QuestionBankItem> {
  const response = await fetch("/api/admin/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  const payload = (await response.json()) as {
    question?: QuestionBankItem;
    error?: string;
  };

  if (!response.ok || !payload.question) {
    throw new Error(payload.error ?? "Could not save the question.");
  }

  return payload.question;
}

async function updateQuestionBankItem(
  questionId: string,
  question: NormalizedQuestionDraft,
): Promise<QuestionBankItem> {
  const response = await fetch(`/api/admin/questions/${questionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  const payload = (await response.json()) as {
    question?: QuestionBankItem;
    error?: string;
  };

  if (!response.ok || !payload.question) {
    throw new Error(payload.error ?? "Could not update the question.");
  }

  return payload.question;
}

export function ExamSheetWorkflow({
  mode,
  defaults,
  exam,
  initialQuestions = [],
  onCreated,
  onUpdated,
  onClose,
}: ExamSheetWorkflowProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    title: exam?.title ?? "",
    description: exam?.description ?? "",
    instructions: exam?.instructions ?? "",
    timezone: exam?.timezone || defaults.defaultTimezone,
    passMark: String(exam?.passMark ?? 50),
  });
  const [status, setStatus] = useState<ExamStatus>(exam?.status ?? "draft");
  const [gradingMode, setGradingMode] = useState<GradingMode>(
    exam?.gradingMode ?? "manual_review_default",
  );
  const [resultReleaseMode, setResultReleaseMode] = useState<ResultReleaseMode>(
    exam?.resultReleaseMode ?? defaults.defaultResultReleaseMode,
  );
  const [shuffleQuestions, setShuffleQuestions] = useState<string>(
    (exam?.shuffleQuestions ?? defaults.defaultShuffleQuestions)
      ? "true"
      : "false",
  );
  const [shuffleOptions, setShuffleOptions] = useState<string>(
    (exam?.shuffleOptions ?? defaults.defaultShuffleOptions) ? "true" : "false",
  );
  const [startAt, setStartAt] = useState<DateTimeValue>(() =>
    exam?.startAt ? fromISOTimestamp(exam.startAt) : createDefaultDateTime(),
  );
  const [endAt, setEndAt] = useState<DateTimeValue>(() => {
    if (exam?.endAt) {
      return fromISOTimestamp(exam.endAt);
    }

    const nextStartAt = exam?.startAt
      ? fromISOTimestamp(exam.startAt)
      : createDefaultDateTime();

    return shiftDateTime(nextStartAt, 60);
  });
  const [userTimezone, setUserTimezone] = useState(defaults.defaultTimezone);
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([
    defaults.defaultTimezone,
  ]);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [questionBankItems, setQuestionBankItems] = useState<
    QuestionBankItem[]
  >([]);
  const [questionBankLoading, setQuestionBankLoading] = useState(false);
  const questionBankFetchedRef = useRef(false);
  const [questionBankError, setQuestionBankError] = useState<string | null>(
    null,
  );
  const createFlowCompletedRef = useRef(false);
  const accessCodeCopiedResetRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [questionBankQuery, setQuestionBankQuery] = useState("");
  const [questionBankSelection, setQuestionBankSelection] = useState<string[]>(
    [],
  );
  const [questionDrafts, setQuestionDrafts] = useState<CreateQuestionDraft[]>(
    () => initialQuestions.map(createQuestionDraftFromBankItem),
  );
  const [saveManualQuestionsForLater, setSaveManualQuestionsForLater] =
    useState(true);
  const [isSavingManualQuestions, setIsSavingManualQuestions] = useState(false);
  const [createdExam, setCreatedExam] = useState<ExamListItemDTO | null>(null);
  const [createdAccessCode, setCreatedAccessCode] = useState("");
  const [accessCodeDialogOpen, setAccessCodeDialogOpen] = useState(false);
  const [accessCodeCopied, setAccessCodeCopied] = useState(false);
  const [accessCodeCopyError, setAccessCodeCopyError] = useState<string | null>(
    null,
  );
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailInputError, setEmailInputError] = useState<string | null>(null);
  const [allEmailsDialogOpen, setAllEmailsDialogOpen] = useState(false);

  const visibleEmailRecipients = emailRecipients.slice(
    0,
    VISIBLE_EMAIL_CHIP_COUNT,
  );
  const hiddenEmailRecipientCount = Math.max(
    emailRecipients.length - VISIBLE_EMAIL_CHIP_COUNT,
    0,
  );

  useEffect(() => {
    const detectedTimezone = resolveUserTimezone(defaults.defaultTimezone);
    setUserTimezone(detectedTimezone);
    setTimezoneOptions(listSupportedTimezones(detectedTimezone));

    if (!exam?.timezone) {
      setFormData((current) => ({ ...current, timezone: detectedTimezone }));
    }
  }, [defaults.defaultTimezone, exam?.timezone]);

  useEffect(() => {
    return () => {
      if (accessCodeCopiedResetRef.current) {
        clearTimeout(accessCodeCopiedResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!questionBankOpen || questionBankFetchedRef.current) {
      return;
    }

    setQuestionBankLoading(true);
    setQuestionBankError(null);

    fetchQuestionBank()
      .then((questions) => {
        setQuestionBankItems(questions);
        questionBankFetchedRef.current = true;
      })
      .catch((loadError) => {
        setQuestionBankError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the question bank.",
        );
      })
      .finally(() => {
        setQuestionBankLoading(false);
      });
  }, [questionBankOpen]);

  const durationMinutes = useMemo(() => {
    const startIso = toISOTimestamp(startAt);
    const endIso = toISOTimestamp(endAt);

    if (!startIso || !endIso) {
      return null;
    }

    const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();

    if (diffMs <= 0) {
      return null;
    }

    return Math.floor(diffMs / 60000);
  }, [endAt, startAt]);

  const selectedQuestionIds = useMemo(
    () =>
      new Set(
        questionDrafts
          .map((question) => question.sourceQuestionId)
          .filter((questionId): questionId is string => Boolean(questionId)),
      ),
    [questionDrafts],
  );
  const questionBankSelectionSet = useMemo(
    () => new Set(questionBankSelection),
    [questionBankSelection],
  );
  const questionBankById = useMemo(
    () => new Map(questionBankItems.map((question) => [question.id, question])),
    [questionBankItems],
  );
  const selectedQuestionCount = questionDrafts.filter(
    (question) => question.title.trim().length > 0,
  ).length;
  const selectedQuestionPointTotal = useMemo(
    () =>
      questionDrafts.reduce((total, question) => {
        const points = Number(question.points);
        return total + (Number.isFinite(points) ? points : 0);
      }, 0),
    [questionDrafts],
  );
  const questionBankFuse = useMemo(
    () =>
      new Fuse(questionBankItems, {
        keys: ["title", "feedback.whenWrong", "options.value"],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [questionBankItems],
  );
  const filteredQuestionBankItems = useMemo(() => {
    const normalizedQuery = questionBankQuery.trim();

    if (!normalizedQuery) {
      return questionBankItems;
    }

    return questionBankFuse
      .search(normalizedQuery)
      .map((result) => result.item);
  }, [questionBankFuse, questionBankItems, questionBankQuery]);

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function toggleQuestionSelection(questionId: string) {
    setQuestionBankSelection((current) => {
      if (current.includes(questionId)) {
        return current.filter((id) => id !== questionId);
      }

      return [...current, questionId];
    });
  }

  function handleAddSelectedQuestions() {
    if (questionBankSelection.length === 0) {
      return;
    }

    const selectedFromBank = questionBankSelection
      .map((questionId) => questionBankById.get(questionId))
      .filter((question): question is QuestionBankItem => Boolean(question));

    setQuestionDrafts((current) => {
      const merged = new Map(
        current.map((question) => [question.id, question]),
      );

      for (const question of selectedFromBank) {
        merged.set(
          `bank_${question.id}`,
          createQuestionDraftFromBankItem(question),
        );
      }

      return Array.from(merged.values());
    });

    setQuestionBankSelection([]);
    setQuestionBankQuery("");
    setQuestionBankOpen(false);
  }

  function updateManualQuestionDraft(
    questionId: string,
    nextQuestion: CreateQuestionDraft,
  ) {
    setQuestionDrafts((current) =>
      current.map((question) =>
        question.id === questionId ? nextQuestion : question,
      ),
    );
  }

  function addManualQuestionDraft() {
    setQuestionDrafts((current) => [...current, createQuestionDraft()]);
  }

  function removeManualQuestionDraft(questionId: string) {
    setQuestionDrafts((current) => {
      const nextQuestions = current.filter(
        (question) => question.id !== questionId,
      );

      return nextQuestions;
    });
  }

  async function addManualQuestionsToExam(): Promise<ExamQuestionPayload[]> {
    const filledDrafts = questionDrafts.filter(
      (question) => question.title.trim().length > 0,
    );

    if (filledDrafts.length === 0) {
      return [];
    }

    const validationError = filledDrafts
      .map(validateQuestionDraft)
      .find(
        (
          message,
        ): message is NonNullable<ReturnType<typeof validateQuestionDraft>> =>
          Boolean(message),
      );

    if (validationError) {
      throw new Error(validationError);
    }

    const normalizedQuestions = filledDrafts
      .map(normalizeQuestionDraft)
      .filter(
        (question): question is NormalizedQuestionDraft => question !== null,
      );
    if (saveManualQuestionsForLater) {
      const savedQuestions = await Promise.all(
        normalizedQuestions.map((question) => {
          const draft = filledDrafts.find((item) => item.id === question.id);

          return draft?.sourceQuestionId
            ? updateQuestionBankItem(draft.sourceQuestionId, question)
            : createQuestionBankItem(question);
        }),
      );
      const questionsToAdd = savedQuestions.map((question) => ({
        sourceQuestionId: question.sourceQuestionId ?? question.id,
        title: question.title,
        required: question.required,
        type: question.type,
        options: question.options,
        points: question.points,
        correctAnswer: question.correctAnswer,
        feedback: question.feedback,
      }));

      setQuestionBankItems((current) => {
        const createdQuestionIds = new Set(
          savedQuestions.map(
            (question) => question.sourceQuestionId ?? question.id,
          ),
        );

        return [
          ...savedQuestions,
          ...current.filter((question) => !createdQuestionIds.has(question.id)),
        ];
      });
      questionBankFetchedRef.current = true;
      setQuestionDrafts(savedQuestions.map(createQuestionDraftFromBankItem));
      return questionsToAdd;
    }

    return normalizedQuestions.map((question) => {
      const draft = filledDrafts.find((item) => item.id === question.id);

      return {
        sourceQuestionId: draft?.sourceQuestionId,
        title: question.title,
        required: question.required,
        type: question.type,
        options: question.options,
        points: question.points,
        correctAnswer: question.correctAnswer,
        feedback: question.feedback,
      };
    });
  }

  function completeCreateFlow() {
    if (createFlowCompletedRef.current) {
      return;
    }

    createFlowCompletedRef.current = true;

    if (createdExam) {
      onCreated?.(createdExam);
    }

    setAccessCodeDialogOpen(false);

    if (!onCreated) {
      router.push("/admin/exams");
    }

    onClose?.();
  }

  async function handleCopyAccessCode() {
    if (!createdAccessCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `Use this code to access your exam: ${createdAccessCode}`,
      );
      setAccessCodeCopied(true);
      setAccessCodeCopyError(null);

      if (accessCodeCopiedResetRef.current) {
        clearTimeout(accessCodeCopiedResetRef.current);
      }

      accessCodeCopiedResetRef.current = setTimeout(() => {
        setAccessCodeCopied(false);
        accessCodeCopiedResetRef.current = null;
      }, ACCESS_CODE_COPIED_RESET_MS);
    } catch {
      setAccessCodeCopyError(
        "Could not copy automatically. Select the code and copy it manually.",
      );
    }
  }

  function addEmailRecipients(values: string[]) {
    const nextEmails = values.map(normalizeEmailInput).filter(Boolean);

    if (nextEmails.length === 0) {
      return;
    }

    const invalidEmail = nextEmails.find((email) => !EMAIL_PATTERN.test(email));

    if (invalidEmail) {
      setEmailInputError(`"${invalidEmail}" is not a valid email address.`);
      return;
    }

    setEmailRecipients((current) => {
      const existingEmails = new Set(current);
      const uniqueEmails = nextEmails.filter((email) => {
        if (existingEmails.has(email)) {
          return false;
        }

        existingEmails.add(email);
        return true;
      });

      return [...current, ...uniqueEmails];
    });
    setEmailInput("");
    setEmailInputError(null);
  }

  function removeEmailRecipient(email: string) {
    setEmailRecipients((current) =>
      current.filter((recipient) => recipient !== email),
    );
  }

  function handleEmailInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (["Enter", "Tab", ","].includes(event.key)) {
      event.preventDefault();
      addEmailRecipients(splitEmailInput(emailInput));
      return;
    }

    if (
      event.key === "Backspace" &&
      !emailInput &&
      emailRecipients.length > 0
    ) {
      removeEmailRecipient(emailRecipients[emailRecipients.length - 1]);
    }
  }

  function handleEmailInputPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedText = event.clipboardData.getData("text");

    if (!EMAIL_SPLIT_PATTERN.test(pastedText)) {
      return;
    }

    event.preventDefault();
    addEmailRecipients(splitEmailInput(pastedText));
  }

  function openEmailDialog() {
    setEmailInput("");
    setEmailInputError(null);
    setEmailDialogOpen(true);
  }

  async function handleFinalSubmit() {
    setError(null);

    if (
      !startAt.date ||
      !endAt.date ||
      !durationMinutes ||
      durationMinutes < 1
    ) {
      setError("Review the exam schedule before saving.");
      return;
    }

    let questionsReadyToSave: ExamQuestionPayload[] = [];
    setIsSavingManualQuestions(true);

    try {
      questionsReadyToSave = await addManualQuestionsToExam();
    } catch (manualQuestionError) {
      setError(
        manualQuestionError instanceof Error
          ? manualQuestionError.message
          : "Could not add the questions.",
      );
      setIsSavingManualQuestions(false);
      return;
    }

    setIsSavingManualQuestions(false);

    if (questionsReadyToSave.length === 0) {
      setError("Add at least one question before saving.");
      return;
    }

    startTransition(async () => {
      try {
        const examResponse = await fetch(
          mode === "create"
            ? "/api/admin/exams"
            : `/api/admin/exams/${exam?.id}`,
          {
            method: mode === "create" ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              durationMinutes,
              passMark: Number(formData.passMark),
              status,
              gradingMode,
              resultReleaseMode,
              shuffleQuestions: shuffleQuestions === "true",
              shuffleOptions: shuffleOptions === "true",
              startAt: toISOTimestamp(startAt),
              endAt: toISOTimestamp(endAt),
              questions: questionsReadyToSave,
            }),
          },
        );

        const examPayload = (await examResponse.json()) as {
          exam?: ExamListItemDTO;
          accessCode?: CreatedExamAccessCode;
          error?: string;
        };

        if (!examResponse.ok || !examPayload.exam) {
          throw new Error(
            examPayload.error ??
              (mode === "create"
                ? "Failed to create the exam."
                : "Failed to save changes."),
          );
        }

        const savedExam = examPayload.exam;

        if (mode === "create") {
          if (!examPayload.accessCode?.code) {
            throw new Error(
              "The exam was created, but no access code returned.",
            );
          }

          setCreatedExam(savedExam);
          setCreatedAccessCode(examPayload.accessCode.code);
          setAccessCodeCopied(false);
          setAccessCodeCopyError(null);
          if (accessCodeCopiedResetRef.current) {
            clearTimeout(accessCodeCopiedResetRef.current);
            accessCodeCopiedResetRef.current = null;
          }
          createFlowCompletedRef.current = false;
          setAccessCodeDialogOpen(true);
        } else {
          onUpdated?.(savedExam);
          if (!onUpdated) {
            router.push("/admin/exams");
          }

          onClose?.();
        }
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : mode === "create"
              ? "Failed to create the exam."
              : "Failed to save changes.",
        );
      }
    });
  }

  return (
    <>
      <Dialog
        open={questionBankOpen}
        onOpenChange={(next) => {
          setQuestionBankOpen(next);

          if (!next) {
            setQuestionBankQuery("");
            setQuestionBankSelection([]);
          }
        }}
      >
        <DialogContent className="flex h-[100dvh] max-w-none flex-col overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-5xl sm:rounded-[28px]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
            <div className="flex flex-col gap-4">
              <div>
                <DialogTitle className="text-slate-900">
                  Select from question bank
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Search the question bank, select the questions you want, and
                  add them to this exam in one go.
                </DialogDescription>
              </div>

              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={questionBankQuery}
                  onChange={(event) => setQuestionBankQuery(event.target.value)}
                  placeholder="Search question bank"
                  className="rounded-xl border-slate-200 bg-white pl-9"
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-slate-50/40 px-6 py-6 sm:max-h-[calc(100dvh-16rem)]">
            {questionBankLoading ? (
              <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-100 bg-white text-sm text-slate-500">
                Loading questions...
              </div>
            ) : questionBankError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-4 text-sm text-red-700">
                {questionBankError}
              </div>
            ) : questionBankItems.length === 0 ? (
              <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-100 bg-white text-sm text-slate-500">
                No questions available.
              </div>
            ) : filteredQuestionBankItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-10 text-center text-sm text-slate-500">
                No questions match your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestionBankItems.map((question) => {
                  const isSelected = questionBankSelectionSet.has(question.id);
                  const isAdded = selectedQuestionIds.has(question.id);

                  return (
                    <label
                      key={question.id}
                      className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border px-4 py-4 transition-colors ${
                        isSelected
                          ? "border-blue-200 bg-blue-50/60"
                          : "border-slate-100 bg-white hover:bg-slate-50/70"
                      } ${isAdded ? "opacity-70" : ""}`}
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {question.title}
                          </h3>
                          {isAdded ? (
                            <Badge variant="success">Added</Badge>
                          ) : null}
                        </div>
                        <QuestionMetaBadges
                          question={question}
                          showOptionCount
                        />
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected || isAdded}
                        disabled={isAdded}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 items-stretch justify-between bg-white px-6 py-4 sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {questionBankSelection.length} question
              {questionBankSelection.length === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuestionBankSelection([]);
                  setQuestionBankQuery("");
                }}
                className="w-full sm:w-auto"
              >
                Clear selection
              </Button>
              <Button
                type="button"
                className="w-full gap-2 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700 sm:w-auto"
                onClick={handleAddSelectedQuestions}
                disabled={questionBankSelection.length === 0}
              >
                Add questions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={accessCodeDialogOpen}
        onOpenChange={(next) => {
          if (!next) {
            completeCreateFlow();
          }
        }}
      >
        <DialogContent className="flex h-[100dvh] max-w-none flex-col overflow-hidden rounded-none border-slate-100 p-0 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-lg sm:rounded-[28px]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
            <div className="flex items-start gap-4">
              <div>
                <DialogTitle className="text-slate-900">
                  Exam created successfully
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Share this 6-character code with candidates so they can attach
                  their account to this exam.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 px-6 py-6">
            <div className="rounded-[22px] border border-slate-100 bg-white p-4 text-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Access code
              </p>
              <p className="mt-2 select-all font-mono text-3xl font-semibold tracking-[0.24em] text-slate-900">
                {createdAccessCode}
              </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handleCopyAccessCode}
                className={`h-auto min-w-0 items-start justify-start gap-3 whitespace-normal rounded-2xl px-4 py-4 text-left transition-all duration-300 ease-out ${
                  accessCodeCopied
                    ? "border border-green-200 bg-green-50 text-slate-900 shadow-sm hover:bg-green-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 transition-all duration-300 ease-out ${
                    accessCodeCopied
                      ? "scale-110 text-green-600"
                      : "scale-100 text-current"
                  }`}
                >
                  {accessCodeCopied ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold leading-snug transition-colors duration-300">
                    {accessCodeCopied ? "Copied" : "Copy access code"}
                  </span>
                  <span
                    className={`block break-words text-xs leading-snug transition-colors duration-300 ${
                      accessCodeCopied ? "text-green-700" : "text-blue-100"
                    }`}
                  >
                    {accessCodeCopied
                      ? "Ready to share"
                      : "Save it to your clipboard"}
                  </span>
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={openEmailDialog}
                className="h-auto min-w-0 items-start justify-start gap-3 whitespace-normal rounded-2xl border-slate-200 bg-white px-4 py-4 text-left"
              >
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold leading-snug">
                    Send by email
                  </span>
                  <span className="block break-words text-xs leading-snug text-slate-500">
                    Add candidate emails
                  </span>
                </span>
              </Button>
            </div>

            {accessCodeCopyError ? (
              <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {accessCodeCopyError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
            <Button
              type="button"
              onClick={completeCreateFlow}
              className="w-full rounded-full bg-blue-600 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="flex h-[100dvh] max-w-none flex-col overflow-hidden rounded-none border-slate-100 p-0 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-xl sm:rounded-[28px]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-slate-900">
                  Send access code by email
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Add the candidate emails that should receive this exam code.
                  The sending service will be connected next.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 px-6 py-6">
            <div className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Access code
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold tracking-[0.16em] text-slate-900">
                    {createdAccessCode}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit">
                  {emailRecipients.length} recipient
                  {emailRecipients.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidate-emails">Candidate emails</Label>
              <div className="rounded-[22px] border border-slate-200 bg-white px-3 py-3 transition-colors focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                <div className="flex min-h-10 flex-wrap items-center gap-2">
                  {visibleEmailRecipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                    >
                      <span className="max-w-[220px] truncate">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeEmailRecipient(email)}
                        className="rounded-full text-blue-400 transition-colors hover:text-blue-700"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}

                  {hiddenEmailRecipientCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAllEmailsDialogOpen(true)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      +{hiddenEmailRecipientCount} more
                    </button>
                  ) : null}

                  <Input
                    id="candidate-emails"
                    value={emailInput}
                    onChange={(event) => {
                      setEmailInput(event.target.value);
                      setEmailInputError(null);
                    }}
                    onKeyDown={handleEmailInputKeyDown}
                    onPaste={handleEmailInputPaste}
                    onBlur={() =>
                      addEmailRecipients(splitEmailInput(emailInput))
                    }
                    placeholder={
                      emailRecipients.length > 0
                        ? "Add another email"
                        : "candidate@example.com"
                    }
                    className="h-8 min-w-[180px] flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Press Enter, comma, or paste a list to add multiple emails.
              </p>
              {emailInputError ? (
                <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {emailInputError}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              className="rounded-full"
            >
              Close
            </Button>
            <Button
              type="button"
              disabled
              className="rounded-full bg-blue-600 px-5 font-semibold text-white"
            >
              Send emails
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={allEmailsDialogOpen} onOpenChange={setAllEmailsDialogOpen}>
        <DialogContent className="flex h-[100dvh] max-w-none flex-col overflow-hidden rounded-none border-slate-100 p-0 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-md sm:rounded-[28px]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-slate-900">
              All recipient emails
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-500">
              Review every email added to this access-code draft.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 px-6 py-5 sm:max-h-[50vh]">
            <div className="space-y-2">
              {emailRecipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <span className="min-w-0 truncate">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeEmailRecipient(email)}
                    className="rounded-full text-slate-400 transition-colors hover:text-red-500"
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
            <Button
              type="button"
              onClick={() => setAllEmailsDialogOpen(false)}
              className="rounded-full bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto w-full max-w-5xl sm:px-6 lg:px-8 px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-3xl">
            {mode === "create" ? "Create a new exam" : "Edit exam"}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-5">
            <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
              <CardHeader>
                <GroupHeading
                  title="Exam information"
                  description="Give the exam a clear name and add the information candidates should see before they begin."
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldWrapper id="title" label="Exam title">
                  <Input
                    id="title"
                    required
                    className="rounded-xl border-slate-200 bg-white"
                    placeholder="e.g. Scholarship Qualifier Exam"
                    value={formData.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="description"
                  label="Description"
                  hint="Shown before candidates begin, so keep it concise and reassuring."
                >
                  <Textarea
                    id="description"
                    rows={3}
                    className="rounded-xl border-slate-200 bg-white"
                    placeholder="Briefly describe what this exam is for."
                    value={formData.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="instructions"
                  label="Instructions"
                  hint="Use this to explain rules, materials, or expectations before the exam starts."
                >
                  <Textarea
                    id="instructions"
                    rows={4}
                    className="rounded-xl border-slate-200 bg-white"
                    placeholder="Add any instructions candidates need before they start."
                    value={formData.instructions}
                    onChange={(event) =>
                      updateField("instructions", event.target.value)
                    }
                  />
                </FieldWrapper>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
              <CardHeader>
                <GroupHeading
                  title="Schedule"
                  description="Choose when the exam opens and closes, and set the timezone candidates should follow."
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldWrapper
                  label="Exam window"
                  hint="Set the opening and closing date/time for when candidates can access this exam."
                >
                  <ExamScheduleCard
                    startValue={startAt}
                    endValue={endAt}
                    onStartChange={setStartAt}
                    onEndChange={setEndAt}
                  />
                </FieldWrapper>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrapper
                    id="timezone"
                    label="Timezone"
                    hint="Use the timezone candidates should follow for this exam."
                  >
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => updateField("timezone", value)}
                    >
                      <SelectTrigger
                        id="timezone"
                        className={SELECT_TRIGGER_CLASS}
                      >
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className={SELECT_CONTENT_CLASS}>
                        {timezoneOptions.map((timezone) => (
                          <SelectItem
                            key={timezone}
                            value={timezone}
                            className={SELECT_ITEM_CLASS}
                          >
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrapper>

                  <FieldWrapper
                    label="Duration"
                    hint="This is calculated automatically from the start and end time."
                  >
                    <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                      {durationMinutes
                        ? formatDurationLabel(durationMinutes)
                        : "Set both times to calculate"}
                    </div>
                  </FieldWrapper>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
              <CardHeader>
                <GroupHeading
                  title="Exam behavior"
                  description="Choose how the exam is scored, when results are released, and how questions are shown."
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrapper
                    id="status"
                    label="Status"
                    hint="Leave this as Draft until you finish setting up candidates and questions."
                  >
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as ExamStatus)}
                    >
                      <SelectTrigger
                        id="status"
                        className={SELECT_TRIGGER_CLASS}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={SELECT_CONTENT_CLASS}>
                        <SelectItem value="draft" className={SELECT_ITEM_CLASS}>
                          Draft
                        </SelectItem>
                        <SelectItem
                          value="published"
                          className={SELECT_ITEM_CLASS}
                        >
                          Published
                        </SelectItem>
                        <SelectItem
                          value="archived"
                          className={SELECT_ITEM_CLASS}
                        >
                          Archived
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldWrapper>

                  <FieldWrapper
                    id="passMark"
                    label="Pass mark (%)"
                    hint="Candidates who score at or above this mark will be counted as having passed."
                  >
                    <Input
                      id="passMark"
                      type="number"
                      min={1}
                      max={100}
                      className="rounded-xl border-slate-200 bg-white"
                      value={formData.passMark}
                      onChange={(event) =>
                        updateField("passMark", event.target.value)
                      }
                    />
                  </FieldWrapper>
                </div>

                <FieldWrapper
                  id="gradingMode"
                  label="Grading mode"
                  tooltip="Use auto-grading for multiple-choice style questions. Written answers will still need review."
                >
                  <Select
                    value={gradingMode}
                    onValueChange={(value) =>
                      setGradingMode(value as GradingMode)
                    }
                  >
                    <SelectTrigger
                      id="gradingMode"
                      className={SELECT_TRIGGER_CLASS}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={SELECT_CONTENT_CLASS}>
                      <SelectItem
                        value="manual_review_default"
                        className={SELECT_ITEM_CLASS}
                      >
                        Manual review (default)
                      </SelectItem>
                      <SelectItem
                        value="auto_grade_objective"
                        className={SELECT_ITEM_CLASS}
                      >
                        Auto-grade objective questions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWrapper>

                <FieldWrapper
                  id="resultReleaseMode"
                  label="Result release"
                  hint="If you later add written questions, results may need to wait until review is complete."
                  tooltip="Choose when candidates can see their result."
                >
                  <Select
                    value={resultReleaseMode}
                    onValueChange={(value) =>
                      setResultReleaseMode(value as ResultReleaseMode)
                    }
                  >
                    <SelectTrigger
                      id="resultReleaseMode"
                      className={SELECT_TRIGGER_CLASS}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={SELECT_CONTENT_CLASS}>
                      <SelectItem
                        value="manual_release"
                        className={SELECT_ITEM_CLASS}
                      >
                        Manual release
                      </SelectItem>
                      <SelectItem
                        value="release_after_review"
                        className={SELECT_ITEM_CLASS}
                      >
                        Release after review
                      </SelectItem>
                      <SelectItem
                        value="auto_release_on_submission"
                        className={SELECT_ITEM_CLASS}
                      >
                        Auto-release on submission
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWrapper>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Question display
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-1">
                    <FieldWrapper
                      id="shuffleQuestions"
                      label="Shuffle questions"
                      tooltip="Candidates will see the questions in a different order."
                    >
                      <Select
                        value={shuffleQuestions}
                        onValueChange={setShuffleQuestions}
                      >
                        <SelectTrigger
                          id="shuffleQuestions"
                          className={SELECT_TRIGGER_CLASS}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={SELECT_CONTENT_CLASS}>
                          <SelectItem
                            value="true"
                            className={SELECT_ITEM_CLASS}
                          >
                            Yes, shuffle them
                          </SelectItem>
                          <SelectItem
                            value="false"
                            className={SELECT_ITEM_CLASS}
                          >
                            No, keep the same order
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWrapper>

                    <FieldWrapper
                      id="shuffleOptions"
                      label="Shuffle options"
                      tooltip="Multiple-choice answer options will appear in a different order for each candidate."
                    >
                      <Select
                        value={shuffleOptions}
                        onValueChange={setShuffleOptions}
                      >
                        <SelectTrigger
                          id="shuffleOptions"
                          className={SELECT_TRIGGER_CLASS}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={SELECT_CONTENT_CLASS}>
                          <SelectItem
                            value="true"
                            className={SELECT_ITEM_CLASS}
                          >
                            Yes, shuffle them
                          </SelectItem>
                          <SelectItem
                            value="false"
                            className={SELECT_ITEM_CLASS}
                          >
                            No, keep the same order
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWrapper>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[24px] border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]">
            <CardHeader>
              <GroupHeading
                title="Select questions"
                description="Choose how you want to build the question list for this exam."
              />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuestionBankOpen(true)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <ListChecks className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        Select from question bank
                      </p>
                    </button>
                    <HelpTooltip label="Help for question bank selection">
                      Search the bank, bulk-select questions, and add them
                      straight into this exam.
                    </HelpTooltip>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={addManualQuestionDraft}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Plus className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        Add manually
                      </p>
                    </button>
                    <HelpTooltip label="Help for manual questions">
                      Create brand-new questions without leaving this flow.
                    </HelpTooltip>
                  </div>
                </div>
              </div>

              {questionDrafts.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {questionDrafts.map((question, index) => (
                      <CreateQuestionBlock
                        key={question.id}
                        value={question}
                        index={index}
                        canDelete
                        onChange={(nextQuestion) =>
                          updateManualQuestionDraft(question.id, nextQuestion)
                        }
                        onDelete={() => removeManualQuestionDraft(question.id)}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addManualQuestionDraft}
                    className="w-full gap-2 rounded-full border-slate-200 bg-white sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add another question
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-end gap-3 text-sm text-slate-600">
                  <Checkbox
                    id="saveQuestionsForLater"
                    checked={saveManualQuestionsForLater}
                    onCheckedChange={(checked) =>
                      setSaveManualQuestionsForLater(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="saveQuestionsForLater"
                    className="font-medium text-slate-800"
                  >
                    Save for later
                  </Label>
                  <HelpTooltip
                    label="What save for later does"
                    iconClassName="h-4 w-4"
                  >
                    When enabled, new manual questions are saved to the question
                    bank and edited bank questions update their original
                    question-bank record when you save the exam.
                  </HelpTooltip>
                </div>

                <Badge variant="outline">
                  {selectedQuestionCount} question
                  {selectedQuestionCount === 1 ? "" : "s"} /{" "}
                  {selectedQuestionPointTotal} pt
                  {selectedQuestionPointTotal === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 space-y-3">
          {error ? (
            <p className="flex-1 text-sm leading-snug text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={isPending || isSavingManualQuestions}
              className="h-12 w-full gap-2 rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700 sm:w-auto"
              onClick={handleFinalSubmit}
            >
              {isPending || isSavingManualQuestions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSavingManualQuestions
                    ? "Adding questions..."
                    : mode === "create"
                      ? "Creating exam..."
                      : "Saving changes..."}
                </>
              ) : (
                <>{mode === "create" ? "Create exam" : "Save changes"}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
