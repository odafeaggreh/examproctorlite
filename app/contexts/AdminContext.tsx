"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { UserData } from "../types/exam";

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  isInitialized: boolean;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  isInitialized: false,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async (user: User) => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          setIsAdmin(
            userData.role === "admin" || userData.role === "superAdmin"
          );
          setIsSuperAdmin(userData.role === "superAdmin");

          if (
            userData.role !== "admin" &&
            userData.role !== "superAdmin" &&
            window.location.pathname.startsWith("/admin")
          ) {
            router.replace("/dashboard");
          }
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          if (window.location.pathname.startsWith("/admin")) {
            router.replace("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    if (!authLoading) {
      if (user) {
        checkAdminStatus(user);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        setIsInitialized(true);
        if (window.location.pathname.startsWith("/admin")) {
          router.replace("/login");
        }
      }
    }
  }, [user, authLoading, router]);

  return (
    <AdminContext.Provider
      value={{ isAdmin, isSuperAdmin, loading, isInitialized }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
