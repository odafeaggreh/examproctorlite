"use client";

import { useId } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateTimeValue {
  date: Date | undefined;
  time: string;
}

interface ExamScheduleCardProps {
  startValue: DateTimeValue;
  endValue: DateTimeValue;
  onStartChange: (value: DateTimeValue) => void;
  onEndChange: (value: DateTimeValue) => void;
}

export function formatDateTimeRangeHint(
  startValue: DateTimeValue,
  endValue: DateTimeValue,
) {
  if (!startValue.date || !endValue.date) {
    return "Choose the exam date and set both times.";
  }

  return `${format(startValue.date, "EEEE, MMM d, yyyy")} from ${startValue.time} to ${endValue.time}`;
}

function formatTriggerLabel(
  startValue: DateTimeValue,
  endValue: DateTimeValue,
) {
  if (!startValue.date || !endValue.date) {
    return "Pick exam date";
  }

  return `${format(startValue.date, "PPP")} ${startValue.time} - ${endValue.time}`;
}

export function ExamScheduleCard({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: ExamScheduleCardProps) {
  const id = useId();
  const selectedDate = startValue.date ?? endValue.date ?? new Date();
  const hasSelection = Boolean(startValue.date && endValue.date);

  function updateDate(nextDate: Date | undefined) {
    if (!nextDate) {
      return;
    }

    onStartChange({ ...startValue, date: nextDate });
    onEndChange({ ...endValue, date: nextDate });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !hasSelection && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="truncate">
            {formatTriggerLabel(startValue, endValue)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[16rem] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="p-3">
          <Calendar
            mode="single"
            required
            selected={selectedDate}
            onSelect={updateDate}
            className="w-full rounded-md border [--cell-size:2.5rem]"
          />

          <div className="border-t mt-5">
            <div className="space-y-2 mt-5">
              <Label htmlFor={`${id}-start-time`}>Start Time</Label>
              <Input
                id={`${id}-start-time`}
                type="time"
                value={startValue.time}
                onChange={(event) =>
                  onStartChange({ ...startValue, time: event.target.value })
                }
              />
            </div>

            <div className="mt-3 space-y-2">
              <Label htmlFor={`${id}-end-time`}>End Time</Label>
              <Input
                id={`${id}-end-time`}
                type="time"
                value={endValue.time}
                onChange={(event) =>
                  onEndChange({ ...endValue, time: event.target.value })
                }
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
