import { z } from 'zod';

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(200).optional(),
  avatarUrl: z.string().url().max(500).or(z.literal('')).optional(),
  acceptingQuestions: z.boolean().optional(),
  tags: z.array(z.string().regex(/^[a-z0-9-]{2,20}$/)).max(10).optional(),
}).passthrough().refine((obj) => Object.keys(obj).length > 0, {
  message: 'At least one field is required',
});
