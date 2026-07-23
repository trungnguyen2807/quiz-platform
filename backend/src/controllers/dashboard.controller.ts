import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

/**
 * ADMIN dashboard statistics:
 * - total quizzes / questions / attempts
 * - average score across all attempts
 * - most played quiz
 * - recent attempts
 */
export async function getDashboard(_req: Request, res: Response) {
  const [totalQuizzes, totalQuestions, totalAttempts, scoreAgg] =
    await Promise.all([
      prisma.quiz.count(),
      prisma.question.count(),
      prisma.attempt.count(),
      prisma.attempt.aggregate({ _avg: { score: true } }),
    ]);

  // Most played quiz (by attempt count).
  const grouped = await prisma.attempt.groupBy({
    by: ['quizId'],
    _count: { quizId: true },
    orderBy: { _count: { quizId: 'desc' } },
    take: 1,
  });

  let mostPlayed: { id: string; title: string; attempts: number } | null = null;
  if (grouped.length > 0) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: grouped[0].quizId },
      select: { id: true, title: true },
    });
    if (quiz) {
      mostPlayed = {
        id: quiz.id,
        title: quiz.title,
        attempts: grouped[0]._count.quizId,
      };
    }
  }

  const recentAttempts = await prisma.attempt.findMany({
    orderBy: { submittedAt: 'desc' },
    take: 10,
    include: { quiz: { select: { title: true } } },
  });

  // Attempts-per-quiz series (useful for a chart on the dashboard).
  const perQuiz = await prisma.quiz.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { attempts: true, questions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    totals: {
      quizzes: totalQuizzes,
      questions: totalQuestions,
      attempts: totalAttempts,
      averageScore: Number((scoreAgg._avg.score ?? 0).toFixed(2)),
    },
    mostPlayed,
    recentAttempts: recentAttempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: a.quiz.title,
      nickname: a.nickname,
      score: a.score,
      correctAnswers: a.correctAnswers,
      totalQuestions: a.totalQuestions,
      timeSpent: a.timeSpent,
      submittedAt: a.submittedAt,
    })),
    quizStats: perQuiz.map((q) => ({
      id: q.id,
      title: q.title,
      attempts: q._count.attempts,
      questions: q._count.questions,
    })),
  });
}
