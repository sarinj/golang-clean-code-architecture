import { z } from "zod";

const passwordSchema = z
  .string()
  .min(1, "Enter your password.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Your password must be 72 bytes or fewer.",
  );

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: passwordSchema,
});

export const registerRequestSchema = loginSchema.extend({
  first_name: z.string().trim().max(100).default(""),
  last_name: z.string().trim().max(100).default(""),
});

export const registerFormSchema = registerRequestSchema
  .extend({
    confirm_password: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Your passwords do not match.",
    path: ["confirm_password"],
  });

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const tokenPairSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
});

export const loginResponseSchema = z.object({
  user: userSchema,
  token: tokenPairSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerFormSchema>;
export type User = z.infer<typeof userSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;
