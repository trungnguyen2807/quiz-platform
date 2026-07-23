import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { ApiError } from '../utils/ApiError.js';
import {
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../validators/schemas.js';

/** ADMIN: create a question (with its choices) under a quiz. */
export async function createQuestion(req: Request, res: Response) {
  const { quizId, content, points, order, choices } =
    req.body as CreateQuestionInput;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, _count: { select: { questions: true } } },
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const question = await prisma.question.create({
    data: {
      quizId,
      content,
      points,
      order: order ?? quiz._count.questions + 1,
      choices: {
        create: choices.map((c) => ({
          content: c.content,
          isCorrect: c.isCorrect,
        })),
      },
    },
    include: { choices: true },
  });

  res.status(201).json(question);
}

/**
 * ADMIN: update a question. If `choices` is provided, the existing choices are
 * replaced wholesale (simplest correct behavior for an editor UI).
 */
export async function updateQuestion(req: Request, res: Response) {
  const { id } = req.params;
  const { content, points, order, choices } = req.body as UpdateQuestionInput;

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Question not found');

  const question = await prisma.$transaction(async (tx) => {
    if (choices) {
      await tx.choice.deleteMany({ where: { questionId: id } });
      await tx.choice.createMany({
        data: choices.map((c) => ({
          questionId: id,
          content: c.content,
          isCorrect: c.isCorrect,
        })),
      });
    }

    return tx.question.update({
      where: { id },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(points !== undefined ? { points } : {}),
        ...(order !== undefined ? { order } : {}),
      },
      include: { choices: true },
    });
  });

  res.json(question);
}

export async function deleteQuestion(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Question not found');

  await prisma.question.delete({ where: { id } });
  res.status(204).send();
}
