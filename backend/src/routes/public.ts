import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  listQuizzesQuerySchema,
  submitAttemptSchema,
} from '../validators/schemas.js';
import {
  getPublicQuiz,
  listPublicQuizzes,
} from '../controllers/quiz.controller.js';
import {
  getAttempt,
  submitAttempt,
} from '../controllers/attempt.controller.js';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';

export const publicRouter = Router();

publicRouter.get(
  '/quizzes',
  validate(listQuizzesQuerySchema, 'query'),
  asyncHandler(listPublicQuizzes)
);
publicRouter.get('/quizzes/:id', asyncHandler(getPublicQuiz));

publicRouter.post(
  '/attempt',
  validate(submitAttemptSchema),
  asyncHandler(submitAttempt)
);
publicRouter.get('/attempt/:id', asyncHandler(getAttempt));

publicRouter.get('/leaderboard/:quizId', asyncHandler(getLeaderboard));
