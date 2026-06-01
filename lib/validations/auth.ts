import { z } from "zod";

export const createSessionSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
});
