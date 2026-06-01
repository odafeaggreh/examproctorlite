"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { ExamTimer } from "@/app/components/ExamTimer";
import { doc, getDoc, setDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";
import { ExamSkeleton } from "@/app/components/ExamSkeleton";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ExamResult, UserData } from "@/app/types/exam";

interface Question {
  id: string;
  title: string;
  type: string;
  required: boolean;
  points: number;
  options?: Array<{
    value: string;
    isCorrect?: boolean;
  }>;
  correctAnswer?: string;
  feedback?: {
    correctAnswer?: string;
    whenWrong?: string;
  };
}

interface ExamInstructions {
  endTime: Timestamp;
  startTime: Timestamp;
}

function ExamsPage() {
  const { user } = useAuth();
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const router = useRouter();

  // Fetch exam data and load saved progress
  useEffect(() => {
    const fetchExamData = async () => {
      if (!user) return;

      try {
        // Fetch exam instructions first to check start and end times
        const examDoc = await getDoc(
          doc(db, "examInstructions", "b27wI1c0ea58Dc1mOSYk")
        );

        if (examDoc.exists()) {
          const data = examDoc.data() as ExamInstructions;
          const endTime = data.endTime.toDate();
          const now = new Date();

          // If exam has ended, redirect to dashboard
          if (now > endTime) {
            router.push("/dashboard");
            return;
          }

          setEndTime(data.endTime.toDate());
          setStartTime(data.startTime.toDate());
        }

        // Load saved data first
        const savedAnswers = localStorage.getItem(`exam_answers_${user.uid}`);
        const savedIndex = localStorage.getItem(
          `exam_current_question_${user.uid}`
        );

        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }

        // Fetch questions
        const response = await fetch(
          `/api/forms/questions?formId=${process.env.NEXT_PUBLIC_GOOGLE_FORM_ID}`
        );
        const data = await response.json();
        setQuestions(data.questions);

        // Set current question index after questions are loaded
        if (savedIndex && data.questions.length > 0) {
          const parsedIndex = parseInt(savedIndex, 10);
          // Validate the saved index against the questions length
          setCurrentQuestionIndex(
            parsedIndex >= 0 && parsedIndex < data.questions.length
              ? parsedIndex
              : 0
          );
        }
      } catch (error) {
        console.error("Error loading exam:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [user, router]);

  // Save answers to localStorage
  useEffect(() => {
    if (!user || Object.keys(answers).length === 0) return;

    try {
      localStorage.setItem(`exam_answers_${user.uid}`, JSON.stringify(answers));
    } catch (error) {
      console.error("Error saving answers to localStorage:", error);
    }
  }, [answers, user]);

  // Save current question index to localStorage
  useEffect(() => {
    if (!user || questions.length === 0) return;

    try {
      localStorage.setItem(
        `exam_current_question_${user.uid}`,
        currentQuestionIndex.toString()
      );
    } catch (error) {
      console.error("Error saving question index:", error);
    }
  }, [currentQuestionIndex, user, questions]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: value,
      };
      return newAnswers;
    });
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);

    if (!user) return;

    try {
      // Check if all required questions are answered
      const unansweredRequired = questions.filter(
        (q) => q.required && !answers[q.id]
      );

      if (unansweredRequired.length > 0) {
        setSnackbarOpen(true);
        return;
      }

      // Calculate score and collect assessment data
      const assessmentData = questions.map((question) => {
        const userAnswer = answers[question.id] || "";
        let isCorrect = false;

        if (question.correctAnswer) {
          isCorrect =
            userAnswer.toLowerCase().trim() ===
            question.correctAnswer.toLowerCase().trim();
        }

        // Create base assessment object
        const assessmentItem: {
          questionId: string;
          questionTitle: string;
          userAnswer: string;
          correctAnswer: string | null;
          isCorrect: boolean;
          pointsEarned: number;
          maxPoints: number;
          feedback?: string;
        } = {
          questionId: question.id,
          questionTitle: question.title,
          userAnswer,
          correctAnswer: question.correctAnswer || null,
          isCorrect,
          pointsEarned: isCorrect ? question.points : 0,
          maxPoints: question.points,
        };

        // Only add feedback if it exists and answer is wrong
        if (!isCorrect && question.feedback?.whenWrong) {
          assessmentItem.feedback = question.feedback.whenWrong;
        }

        return assessmentItem;
      });

      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const earnedPoints = assessmentData.reduce(
        (sum, q) => sum + q.pointsEarned,
        0
      );

      // Update user document
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          examsTaken: arrayUnion({
            examId: process.env.NEXT_PUBLIC_GOOGLE_FORM_ID,
            takenAt: Timestamp.now(),
            startTime,
            endTime,
            answers,
            assessment: {
              questions: assessmentData,
              totalPoints,
              earnedPoints,
              percentage: (earnedPoints / totalPoints) * 100,
            },
            totalQuestions: questions.length,
            answeredQuestions: Object.keys(answers).length,
            emailSent: false,
          }),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Clear localStorage
      localStorage.removeItem(`exam_answers_${user.uid}`);
      localStorage.removeItem(`exam_current_question_${user.uid}`);

      router.push("/thank-you");
    } catch (error) {
      console.error("Error submitting exam:", error);
    } finally {
      setIsSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleSubmitClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleTimeUp = () => {
    handleSubmitExam();
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.required && !answers[currentQuestion.id]) {
      setSnackbarOpen(true);
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const checkExamStatus = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          const hasCompletedExam = userData.examsTaken?.some(
            (exam: ExamResult) =>
              exam.examId === process.env.NEXT_PUBLIC_GOOGLE_FORM_ID
          );

          if (hasCompletedExam) {
            router.push("/thank-you");
          }
        }
      } catch (error) {
        console.error("Error checking exam status:", error);
      }
    };

    checkExamStatus();
  }, [user, router]);

  if (loading || !startTime || !endTime || !questions.length) {
    return <ExamSkeleton />;
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Alert severity="error">
          No questions are available for this exam. Please contact your
          administrator.
        </Alert>
      </div>
    );
  }

  // Add submit button for last question
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <ExamTimer
        startTime={startTime}
        endTime={endTime}
        onTimeUp={handleTimeUp}
      />

      <div className="bg-gray-50 rounded-t-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-lg font-medium text-gray-700">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h1>
          <span className="text-sm text-gray-500">
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
            Complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            Points: {currentQuestion.points}
          </span>
          {currentQuestion.required && (
            <span className="text-sm text-red-500">*Required</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-b-lg shadow-sm p-6 mb-6 border-x border-b border-gray-200">
        <div className="flex gap-2 mb-4">
          <span className="font-medium text-gray-600">
            {currentQuestionIndex + 1}.
          </span>
          <h2 className="font-medium text-gray-900">{currentQuestion.title}</h2>
        </div>

        {currentQuestion.type === "RADIO" && currentQuestion.options && (
          <div className="ml-6 space-y-3">
            {currentQuestion.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 p-2 rounded-md cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option.value}
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                {option.value}
              </label>
            ))}
          </div>
        )}

        {currentQuestion.type === "TEXT" && (
          <div className="ml-6">
            <textarea
              className="w-full rounded-md border border-gray-200 shadow-sm outline-none focus:border-blue-500 focus:ring-blue-500 p-2"
              rows={3}
              placeholder="Enter your answer here..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, e.target.value)
              }
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            currentQuestionIndex === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
          Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmitClick}
            className={`flex items-center gap-2 px-6 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors`}
          >
            Submit Exam
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Next
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="confirm-submit-dialog"
      >
        <DialogTitle id="confirm-submit-dialog">
          Confirm Exam Submission
        </DialogTitle>
        <DialogContent>
          Are you sure you want to submit your exam? Once submitted, you
          won&apos;t be able to make any changes.
        </DialogContent>
        <DialogActions>
          <button
            onClick={handleCloseDialog}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors ${
              isSubmitting ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-2 rounded-md ${
              isSubmitting
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            } text-white transition-colors`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submit
              </>
            ) : (
              "Submit"
            )}
          </button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          This question is required. Please provide an answer before proceeding.
        </Alert>
      </Snackbar>
    </div>
  );
}

export default ExamsPage;
