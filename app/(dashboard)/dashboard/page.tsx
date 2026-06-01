"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";
import Alert from "@mui/material/Alert";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ExamInstructions {
  canSaveForLater: boolean;
  startTime: Date;
  endTime: Date;
  numberOfQuestions: number;
}

function DashboardPage() {
  const router = useRouter();
  const [examDetails, setExamDetails] = useState<ExamInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeToStart, setTimeToStart] = useState<string>("");
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    if (!examDetails) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const startTime = examDetails.startTime.getTime();
      const endTime = examDetails.endTime.getTime();
      const difference = startTime - now;

      if (now > endTime) {
        setHasEnded(true);
        setHasStarted(false);
        clearInterval(timer);
        return;
      }

      if (difference <= 0) {
        setHasStarted(true);
        clearInterval(timer);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeToStart(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [examDetails]);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const examDoc = await getDoc(
          doc(db, "examInstructions", "b27wI1c0ea58Dc1mOSYk")
        );

        if (examDoc.exists()) {
          const data = examDoc.data();
          setExamDetails({
            canSaveForLater: data.canSaveForLater,
            startTime: data.startTime.toDate(),
            endTime: data.endTime.toDate(),
            numberOfQuestions: data.numberOfQuestions,
          });
        }
      } catch (error) {
        console.error("Error fetching exam details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, []);

  // Calculate exam duration in hours
  const getExamDuration = () => {
    if (!examDetails) return "...";

    const durationMs =
      examDetails.endTime.getTime() - examDetails.startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }

    return `${hours} hour${hours !== 1 ? "s" : ""} and ${minutes} minute${
      minutes !== 1 ? "s" : ""
    }`;
  };

  const instructions = [
    "Read all questions carefully before attempting to answer.",
    "The exam starts at 10:00 AM (Athens Time / UTC+2).",
    `You have ${getExamDuration()} to complete this examination.`,
    `This exam contains ${examDetails?.numberOfQuestions || "..."} questions.`,
    "If you experience technical difficulties, contact your supervisor immediately.",
  ];

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6">Loading exam details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6 text-center p-4 bg-gray-100 rounded-lg">
        {hasEnded ? (
          <p className="text-red-600 font-medium">This exam has ended</p>
        ) : hasStarted ? (
          <p className="text-green-600 font-medium">This exam has started</p>
        ) : (
          <p className="text-blue-600 font-medium">
            The exam starts in: <span className="font-bold">{timeToStart}</span>
          </p>
        )}
      </div>

      <h1 className="text-2xl font-semibold text-gray-900">
        Exam Instructions
      </h1>

      <div className="mt-6 bg-gray-100 rounded-lg shadow-sm p-6">
        <div className="prose prose-slate max-w-none">
          {instructions.map((instruction: string, index: number) => (
            <div key={index} className="flex gap-3 mb-4">
              <span className="flex-shrink-0 text-gray-900">•</span>
              <p className="text-gray-700">{instruction}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Alert severity="warning">
            Please note: If you do not complete the exam within the allocated
            time, your answers will be automatically submitted and you will be
            logged out of the system.
          </Alert>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          className={`px-12 py-3 rounded-md font-medium transition-colors 
            ${
              hasStarted && !hasEnded
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-400 cursor-not-allowed text-white"
            }`}
          disabled={!hasStarted || hasEnded}
          onClick={() => {
            if (hasStarted && !hasEnded) {
              router.push("/exams");
            }
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
