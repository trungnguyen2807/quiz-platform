import { z } from 'zod';

export const difficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD']);

// ---- Auth ----
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Quiz ----
export const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  difficulty: difficultyEnum.default('EASY'),
  timeLimit: z.number().int().min(0).max(36000).default(0),
  isPublished: z.boolean().optional().default(false),
});

export const updateQuizSchema = createQuizSchema.partial();

// ---- Question / Choice ----
const choiceInputSchema = z.object({
  content: z.string().min(1, 'Choice content is required').max(500),
  isCorrect: z.boolean().default(false),
});

export const createQuestionSchema = z
  .object({
    quizId: z.string().min(1, 'quizId is required'),
    content: z.string().min(1, 'Question content is required').max(1000),
    points: z.number().int().min(1).max(100).default(1),
    order: z.number().int().min(0).optional(),
    choices: z
      .array(choiceInputSchema)
      .min(2, 'A question needs at least 2 choices')
      .max(6, 'A question can have at most 6 choices'),
  })
  .refine((q) => q.choices.some((c) => c.isCorrect), {
    message: 'At least one choice must be marked correct',
    path: ['choices'],
  });

export const updateQuestionSchema = z
  .object({
    content: z.string().min(1).max(1000).optional(),
    points: z.number().int().min(1).max(100).optional(),
    order: z.number().int().min(0).optional(),
    choices: z.array(choiceInputSchema).min(2).max(6).optional(),
  })
  .refine((q) => !q.choices || q.choices.some((c) => c.isCorrect), {
    message: 'At least one choice must be marked correct',
    path: ['choices'],
  });

// ---- Attempt ----
export const submitAttemptSchema = z.object({
  quizId: z.string().min(1, 'quizId is required'),
  nickname: z.string().min(1, 'Nickname is required').max(50),
  timeSpent: z.number().int().min(0).max(36000).default(0),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        choiceId: z.string().min(1).nullable(),
      })
    )
    .min(1, 'At least one answer is required'),
});

export const listQuizzesQuerySchema = z.object({
  category: z.string().optional(),
  difficulty: difficultyEnum.optional(),
  search: z.string().optional(),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
