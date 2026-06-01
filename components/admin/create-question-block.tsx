"use client";

import { ChevronDown, MoreVertical, Plus, Trash2, X } from "lucide-react";
import type { QuestionType } from "@/lib/types/exam-management";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const QUESTION_TYPE_OPTIONS = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "checkboxes", label: "Checkboxes" },
  { value: "dropdown", label: "Drop-down" },
  { value: "short_text", label: "Short text" },
  { value: "paragraph", label: "Paragraph" },
] satisfies Array<{ value: QuestionType; label: string }>;

export const QUESTION_TYPE_LABELS = QUESTION_TYPE_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<QuestionType, string>,
);

export interface QuestionDraftOption {
  id: string;
  value: string;
  isCorrect: boolean;
}

export interface CreateQuestionDraft {
  id: string;
  sourceQuestionId?: string;
  title: string;
  type: QuestionType;
  options: QuestionDraftOption[];
  points: string;
  required: boolean;
}

export interface NormalizedQuestionDraft {
  id: string;
  title: string;
  required: boolean;
  type: QuestionType;
  options: Array<{ value: string; isCorrect: boolean }>;
  points: number;
  correctAnswer: string;
  feedback: { whenWrong?: string };
}

interface QuestionBankDraftSource {
  id: string;
  sourceQuestionId?: string;
  title: string;
  type: QuestionType;
  options: Array<{ value: string; isCorrect: boolean }>;
  points: number;
  required: boolean;
}

function createDraftId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createDefaultOption(): QuestionDraftOption {
  return {
    id: createDraftId("option"),
    value: "",
    isCorrect: false,
  };
}

export function isOptionQuestion(type: QuestionType) {
  return (
    type === "multiple_choice" || type === "checkboxes" || type === "dropdown"
  );
}

export function createQuestionDraft(): CreateQuestionDraft {
  return {
    id: createDraftId("question"),
    title: "",
    type: "multiple_choice",
    options: [createDefaultOption(), createDefaultOption()],
    points: "1",
    required: false,
  };
}

export function createQuestionDraftFromBankItem(
  question: QuestionBankDraftSource,
): CreateQuestionDraft {
  return {
    id: `bank_${question.id}`,
    sourceQuestionId: question.sourceQuestionId,
    title: question.title,
    type: question.type,
    options:
      question.options.length > 0
        ? question.options.map((option, index) => ({
            id: createDraftId(`option_${index + 1}`),
            value: option.value,
            isCorrect: option.isCorrect,
          }))
        : [createDefaultOption(), createDefaultOption()],
    points: String(question.points),
    required: question.required,
  };
}

export function normalizeQuestionDraft(
  draft: CreateQuestionDraft,
): NormalizedQuestionDraft | null {
  const title = draft.title.trim();

  if (!title) {
    return null;
  }

  const points = Number(draft.points);
  const normalizedOptions = isOptionQuestion(draft.type)
    ? draft.options
        .map((option) => ({
          value: option.value.trim(),
          isCorrect: option.isCorrect,
        }))
        .filter((option) => option.value.length > 0)
    : [];
  const correctAnswers = normalizedOptions.filter((option) => option.isCorrect);

  return {
    id: draft.id,
    title,
    required: draft.required,
    type: draft.type,
    options: normalizedOptions,
    points: Number.isFinite(points) && points >= 0 ? Math.round(points) : 1,
    correctAnswer: correctAnswers[0]?.value ?? "",
    feedback: {},
  };
}

export function validateQuestionDraft(draft: CreateQuestionDraft) {
  const normalized = normalizeQuestionDraft(draft);

  if (!normalized) {
    return "Enter the question text before adding it.";
  }

  if (isOptionQuestion(normalized.type)) {
    if (normalized.options.length < 2) {
      return "Add at least two answer options for each choice-based question.";
    }

    if (!normalized.options.some((option) => option.isCorrect)) {
      return "Mark at least one correct answer for each choice-based question.";
    }
  }

  return null;
}

interface CreateQuestionBlockProps {
  value: CreateQuestionDraft;
  index: number;
  canDelete?: boolean;
  onChange: (nextQuestion: CreateQuestionDraft) => void;
  onDelete: () => void;
}

export function CreateQuestionBlock({
  value,
  index,
  canDelete = true,
  onChange,
  onDelete,
}: CreateQuestionBlockProps) {
  const selectedTypeLabel = QUESTION_TYPE_LABELS[value.type];
  const showOptionEditor = isOptionQuestion(value.type);

  function updateQuestion(nextValue: Partial<CreateQuestionDraft>) {
    onChange({ ...value, ...nextValue });
  }

  function updateType(type: QuestionType) {
    const nextOptions =
      isOptionQuestion(type) && value.options.length === 0
        ? [createDefaultOption(), createDefaultOption()]
        : value.options;

    updateQuestion({ type, options: nextOptions });
  }

  function updateOption(
    optionId: string,
    nextValue: Partial<QuestionDraftOption>,
  ) {
    updateQuestion({
      options: value.options.map((option) =>
        option.id === optionId ? { ...option, ...nextValue } : option,
      ),
    });
  }

  function setCorrectOption(optionId: string, checked: boolean) {
    updateQuestion({
      options: value.options.map((option) => {
        if (value.type === "checkboxes") {
          return option.id === optionId
            ? { ...option, isCorrect: checked }
            : option;
        }

        return { ...option, isCorrect: option.id === optionId };
      }),
    });
  }

  function addOption() {
    updateQuestion({
      options: [...value.options, createDefaultOption()],
    });
  }

  function removeOption(optionId: string) {
    const nextOptions = value.options.filter(
      (option) => option.id !== optionId,
    );
    updateQuestion({
      options:
        nextOptions.length > 0
          ? nextOptions
          : [createDefaultOption()],
    });
  }

  return (
    <section className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label
            htmlFor={`${value.id}-title`}
            className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400"
          >
            Question {index + 1}
          </Label>
          <Input
            id={`${value.id}-title`}
            value={value.title}
            onChange={(event) => updateQuestion({ title: event.target.value })}
            placeholder="Enter your question"
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 text-base"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-between gap-3 rounded-2xl border-slate-200 bg-white px-4 lg:min-w-48"
            >
              {selectedTypeLabel}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            {QUESTION_TYPE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => updateType(option.value)}
                className="rounded-xl px-3 py-2"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 justify-self-end rounded-2xl border-slate-200 bg-white text-slate-500 hover:text-slate-900"
              aria-label={`Open actions for question ${index + 1}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
            <DropdownMenuItem
              variant="destructive"
              disabled={!canDelete}
              onSelect={onDelete}
              className="rounded-xl px-3 py-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete question
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-5 space-y-3">
        {showOptionEditor ? (
          <>
            <div className="space-y-2">
              {value.options.map((option, optionIndex) => (
                <div
                  key={option.id}
                  className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center"
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    {value.type === "multiple_choice" ? (
                      <RadioGroup
                        value={option.isCorrect ? option.id : ""}
                        className="w-auto"
                      >
                        <RadioGroupItem
                          value={option.id}
                          disabled
                          className="size-5 border-slate-300 bg-white disabled:opacity-100 data-checked:border-blue-600 data-checked:bg-blue-600"
                        />
                      </RadioGroup>
                    ) : value.type === "checkboxes" ? (
                      <Checkbox
                        checked={false}
                        disabled
                        className="size-5 border-slate-300 bg-white disabled:opacity-100"
                      />
                    ) : (
                      <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                        {optionIndex + 1}
                      </span>
                    )}
                    {value.type !== "dropdown" ? (
                      <span className="text-xs font-semibold">
                        {optionIndex + 1}
                      </span>
                    ) : null}
                  </div>

                  <Input
                    value={option.value}
                    onChange={(event) =>
                      updateOption(option.id, { value: event.target.value })
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                    className="h-10 rounded-xl border-slate-200 bg-white"
                  />

                  <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
                    <Checkbox
                      checked={option.isCorrect}
                      onCheckedChange={(checked) =>
                        setCorrectOption(option.id, checked === true)
                      }
                      className="size-5 border-slate-300 bg-white data-checked:border-blue-600 data-checked:bg-blue-600"
                    />
                    Correct
                  </label>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                    className="h-9 w-9 justify-self-start rounded-full text-slate-400 hover:text-red-600 sm:justify-self-auto"
                    aria-label={`Remove option ${optionIndex + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="gap-2 rounded-full border-slate-200"
            >
              <Plus className="h-4 w-4" />
              Add option
            </Button>
          </>
        ) : value.type === "paragraph" ? (
          <Textarea
            disabled
            placeholder="Long answer text"
            className="min-h-28 resize-none rounded-2xl border-slate-200 bg-slate-50/70"
          />
        ) : (
          <Input
            disabled
            placeholder="Short answer text"
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/70"
          />
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
              <span className="text-sm font-medium text-slate-700">
                Required
              </span>
              <Switch
                checked={value.required}
                onCheckedChange={(required) => updateQuestion({ required })}
                className="data-checked:bg-blue-600 data-unchecked:bg-slate-300 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-300"
              />
            </label>

            <div className="flex items-center gap-2">
              <Label
                htmlFor={`${value.id}-points`}
                className="text-sm font-medium text-slate-700"
              >
                Points
              </Label>
              <Input
                id={`${value.id}-points`}
                type="number"
                min={0}
                value={value.points}
                onChange={(event) =>
                  updateQuestion({ points: event.target.value })
                }
                className="h-10 w-24 rounded-xl border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
