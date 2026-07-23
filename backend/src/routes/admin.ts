import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  createQuestionSchema,
  createQuizSchema,
  loginSchema,
  updateQuestionSchema,
  updateQuizSchema,
} from '../validators/schemas.js';
import { login } from '../controllers/auth.controller.js';
import {
  createQuiz,
  deleteQuiz,
  getAdminQuiz,
  listAdminQuizzes,
  setPublishState,
  updateQuiz,
} from '../controllers/quiz.controller.js';
import {
  createQuestion,
  deleteQuestion,
  updateQuestion,
} from '../controllers/question.controller.js';
import { getDashboard } from '../controllers/dashboard.controller.js';

export const adminRouter = Router();

// Public admin endpoint (no token needed to log in).
adminRouter.post('/login', validate(loginSchema), asyncHandler(login));

// Everything below requires a valid admin token.
adminRouter.use(requireAdmin);

adminRouter.get('/dashboard', asyncHandler(getDashboard));

// Quizzes
adminRouter.get('/quizzes', asyncHandler(listAdminQuizzes));
adminRouter.get('/quizzes/:id', asyncHandler(getAdminQuiz));
adminRouter.post('/quizzes', validate(createQuizSchema), asyncHandler(createQuiz));
adminRouter.put(
  '/quizzes/:id',
  validate(updateQuizSchema),
  asyncHandler(updateQuiz)
);
adminRouter.patch('/quizzes/:id/publish', asyncHandler(setPublishState));
adminRouter.delete('/quizzes/:id', asyncHandler(deleteQuiz));

// Questions
adminRouter.post(
  '/questions',
  validate(createQuestionSchema),
  asyncHandler(createQuestion)
);
adminRouter.put(
  '/questions/:id',
  validate(updateQuestionSchema),
  asyncHandler(updateQuestion)
);
adminRouter.delete('/questions/:id', asyncHandler(deleteQuestion));
