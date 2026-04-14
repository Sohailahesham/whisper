import { z } from 'zod';

export const createQuestionSchema = z.object({
  body: z.string().min(1).max(500),
}).strict();

export const answerSchema = z.object({
  answer: z.string().min(1).max(1000),
  visibility: z.enum(['public', 'private']).optional(),
}).strict();

export const updateQuestionSchema = z.object({
  answer: z.string().min(1).max(1000).optional(),
  status: z.enum(['pending', 'answered', 'ignored']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
}).strict().refine((obj) => Object.keys(obj).length > 0, {
  message: 'At least one field is required',
});
