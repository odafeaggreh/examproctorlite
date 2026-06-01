export interface ExamAnswer {
  questionId: string;
  questionTitle: string;
  userAnswer: string;
  correctAnswer: string | null;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
}

export interface ExamResult {
  examId: string;
  takenAt: {
    seconds: number;
    nanoseconds: number;
  };
  assessment: {
    percentage: number;
    questions: Array<{
      questionTitle: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  };
  totalQuestions: number;
  answeredQuestions: number;
}

export type UserRole = "admin" | "superAdmin" | "student" | "user";

export interface UserData {
  role?: UserRole;
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  examsTaken: ExamResult[];
}
