"use client";

import { useEffect, useState } from "react";
import { LinearProgress } from "@mui/material";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  startTime: Date;
  endTime: Date;
  onTimeUp: () => void;
}

export function ExamTimer({ startTime, endTime, onTimeUp }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [progress, setProgress] = useState(0);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const totalDuration = endTime.getTime() - startTime.getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = endTime.getTime() - now;

      // Calculate elapsed time as a percentage of total duration
      const elapsedTime = now - startTime.getTime();
      const progressPercent = Math.min(
        100,
        (elapsedTime / totalDuration) * 100
      );

      setProgress(progressPercent);

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft("00:00:00");
        setProgress(100);
        onTimeUp();
        return;
      }

      // Show warning when less than 5 minutes remaining
      if (difference <= 5 * 60 * 1000 && !isWarning) {
        setIsWarning(true);
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const newTimeLeft = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime, onTimeUp, isWarning]);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Remaining
        </div>
        <div
          className={`text-base font-normal ${
            isWarning ? "text-red-600" : "text-gray-900"
          }`}
        >
          {timeLeft}
        </div>
      </div>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: isWarning
            ? "rgba(239, 68, 68, 0.2)"
            : "rgba(0, 0, 0, 0.1)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: isWarning ? "#EF4444" : "#3B82F6",
            borderRadius: 3,
          },
        }}
      />
    </div>
  );
}
