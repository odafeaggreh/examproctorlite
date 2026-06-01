import { getAdminDb } from "@/lib/firebase/admin";
import type { PlatformDefaults } from "@/lib/types/exam-management";

const FALLBACK_DEFAULTS: PlatformDefaults = {
  defaultAccessCodeMaxUses: 1,
  defaultAccessCodeExpiryDays: 14,
  defaultExamDurationMinutes: 60,
  defaultTimezone: "Europe/Greece",
  defaultResultReleaseMode: "manual_release",
  defaultShuffleQuestions: false,
  defaultShuffleOptions: false,
};

export async function getPlatformDefaults(): Promise<PlatformDefaults> {
  try {
    const snapshot = await getAdminDb()
      .collection("platformSettings")
      .doc("defaults")
      .get();

    if (!snapshot.exists) {
      return FALLBACK_DEFAULTS;
    }

    const data = snapshot.data() as Partial<PlatformDefaults> | undefined;

    return {
      defaultAccessCodeMaxUses:
        data?.defaultAccessCodeMaxUses ??
        FALLBACK_DEFAULTS.defaultAccessCodeMaxUses,
      defaultAccessCodeExpiryDays:
        data?.defaultAccessCodeExpiryDays ??
        FALLBACK_DEFAULTS.defaultAccessCodeExpiryDays,
      defaultExamDurationMinutes:
        data?.defaultExamDurationMinutes ??
        FALLBACK_DEFAULTS.defaultExamDurationMinutes,
      defaultTimezone:
        data?.defaultTimezone ?? FALLBACK_DEFAULTS.defaultTimezone,
      defaultResultReleaseMode:
        data?.defaultResultReleaseMode ??
        FALLBACK_DEFAULTS.defaultResultReleaseMode,
      defaultShuffleQuestions:
        data?.defaultShuffleQuestions ??
        FALLBACK_DEFAULTS.defaultShuffleQuestions,
      defaultShuffleOptions:
        data?.defaultShuffleOptions ?? FALLBACK_DEFAULTS.defaultShuffleOptions,
    };
  } catch (error) {
    console.error("Failed to load platform defaults", error);
    return FALLBACK_DEFAULTS;
  }
}
