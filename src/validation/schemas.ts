import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name is too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
});

export const groupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Group name is too long"),
  description: z.string().max(255, "Description is too long").optional(),
});

export const profileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50).optional(),
  last_name: z.string().min(1, "Last name is required").max(50).optional(),
  username: z.string().min(3, "Username is too short").max(30).optional(),
  bio: z.string().max(500, "Bio is too long").optional(),
  is_public: z.boolean().optional(),
});

export const searchSchema = z.object({
  query: z.string().max(100, "Search query is too long").optional(),
  entities: z.array(z.enum(["events", "artists", "acts", "users"])).optional(),
  per_page: z.number().min(1).max(100).optional(),
});

export const validate = <T>(schema: z.Schema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(firstError.message);
    }
    throw error;
  }
};
