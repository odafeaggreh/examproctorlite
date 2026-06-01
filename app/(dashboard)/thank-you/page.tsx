"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";
import { ExamResult, UserData } from "@/app/types/exam";

export default function ThankYouPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const verifyCompletion = async () => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          const hasCompletedExam = userData.examsTaken?.some(
            (exam: ExamResult) =>
              exam.examId === process.env.NEXT_PUBLIC_GOOGLE_FORM_ID
          );

          if (!hasCompletedExam) {
            router.push("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error verifying exam completion:", error);
      }
    };

    verifyCompletion();
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Thank You!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your exam has been successfully submitted.
          </p>
        </div>
        <div className="mt-4">
          <p className="text-gray-600">
            We appreciate your participation. Your results will be available
            soon.
          </p>
        </div>
      </div>
    </div>
  );
}
