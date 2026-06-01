"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebaseConfig";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  variant = "ghost",
  className,
}: {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  className?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to clear session cookie", error);
    }

    await signOut(auth);
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button className={className} onClick={handleLogout} variant={variant}>
      Log out
    </Button>
  );
}
