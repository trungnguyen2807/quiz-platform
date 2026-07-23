import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { ApiError } from '../utils/ApiError.js';
import {
  CreateQuizInput,
  UpdateQuizInput,
} from '../validators/schemas.js';

/**
 * PUBLIC: list published quizzes with lightweight metadata (question count,
 * attempt count). Never exposes questions/answers.
 */
export async function listPublicQuizzes(req: Request, res: Response) {
  const { category, difficulty, search } = req.query as {
    category?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    search?: string;
  };

  const where: Prisma.QuizWhereInput = {
    isPublished: true,
    ...(category ? { category } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const quizzes = await prisma.quiz.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      difficulty: true,
      timeLimit: true,
      createdAt: true,
      _count: { select: { questions: true, attempts: true } },
    },
  });

  res.json(
    quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      timeLimit: q.timeLimit,
      createdAt: q.createdAt,
      questionCount: q._count.questions,
      attemptCount: q._count.attempts,
    }))
  );
}

/**
 * PUBLIC: fetch a single published quiz WITH its questions and choices,
 * but WITHOUT revealing which choice is correct (anti-cheat).
 */
export async function getPublicQuiz(req: Request, res: Response) {
  const { id } = req.params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, isPublished: true },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          choices: {
            select: { id: true, content: true }, // isCorrect deliberately omitted
          },
        },
      },
    },
  });

  if (!quiz) {
    throw ApiError.notFound('Quiz not found or not published');
  }

  res.json({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    difficulty: quiz.difficulty,
    timeLimit: quiz.timeLimit,
    totalQuestions: quiz.questions.length,
    totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
    questions: quiz.questions.map((q) => ({
      id: q.id,
      content: q.content,
      points: q.points,
      order: q.order,
      choices: q.choices,
    })),
  });
}

// ---------------- ADMIN ----------------

/** ADMIN: list all quizzes (published or not) owned across the platform. */
export async function listAdminQuizzes(_req: Request, res: Response) {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { questions: true, attempts: true } },
    },
  });

  res.json(
    quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      timeLimit: q.timeLimit,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      questionCount: q._count.questions,
      attemptCount: q._count.attempts,
    }))
  );
}

/** ADMIN: full quiz detail including correct answers, for editing. */
export async function getAdminQuiz(req: Request, res: Response) {
  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { choices: true },
      },
    },
  });

  if (!quiz) {
    throw ApiError.notFound('Quiz not found');
  }

  res.json(quiz);
}

export async function createQuiz(req: Request, res: Response) {
  const data = req.body as CreateQuizInput;
  const adminId = req.admin!.sub;

  const quiz = await prisma.quiz.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      category: data.category ?? null,
      difficulty: data.difficulty,
      timeLimit: data.timeLimit,
      isPublished: data.isPublished ?? false,
      createdBy: adminId,
    },
  });

  res.status(201).json(quiz);
}

export async function updateQuiz(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as UpdateQuizInput;

  const existing = await prisma.quiz.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Quiz not found');

  const quiz = await prisma.quiz.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
      ...(data.timeLimit !== undefined ? { timeLimit: data.timeLimit } : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
    },
  });

  res.json(quiz);
}

export async function deleteQuiz(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.quiz.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Quiz not found');

  await prisma.quiz.delete({ where: { id } });
  res.status(204).send();
}

/** ADMIN: toggle publish state explicitly. */
export async function setPublishState(req: Request, res: Response) {
  const { id } = req.params;
  const isPublished = Boolean((req.body as { isPublished?: boolean }).isPublished);

  const existing = await prisma.quiz.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });
  if (!existing) throw ApiError.notFound('Quiz not found');

  if (isPublished && existing._count.questions === 0) {
    throw ApiError.badRequest('Cannot publish a quiz with no questions');
  }

  const quiz = await prisma.quiz.update({
    where: { id },
    data: { isPublished },
  });

  res.json(quiz);
}
