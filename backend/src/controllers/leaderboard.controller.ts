import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * PUBLIC: leaderboard for a quiz.
 * Sort order: score DESC, timeSpent ASC, submittedAt ASC.
 */
export async function getLeaderboard(req: Request, res: Response) {
  const { quizId } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, title: true },
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const attempts = await prisma.attempt.findMany({
    where: { quizId },
    orderBy: [
      { score: 'desc' },
      { timeSpent: 'asc' },
      { submittedAt: 'asc' },
    ],
    take: limit,
    select: {
      id: true,
      nickname: true,
      score: true,
      correctAnswers: true,
      totalQuestions: true,
      timeSpent: true,
      submittedAt: true,
    },
  });

  res.json({
    quizId: quiz.id,
    quizTitle: quiz.title,
    entries: attempts.map((a, index) => ({
      rank: index + 1,
      attemptId: a.id,
      nickname: a.nickname,
      score: a.score,
      correctAnswers: a.correctAnswers,
      totalQuestions: a.totalQuestions,
      timeSpent: a.timeSpent,
      submittedAt: a.submittedAt,
    })),
  });
}
