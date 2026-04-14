import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
  displayName: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
