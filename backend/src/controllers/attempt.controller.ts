import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { SubmitAttemptInput } from '../validators/schemas.js';

/**
 * PUBLIC: submit an attempt. The frontend sends only quizId, nickname and the
 * chosen choiceId per question. The server looks up the correct answers,
 * grades, persists the attempt, and returns the result.
 */
export async function submitAttempt(req: Request, res: Response) {
  const { quizId, nickname, timeSpent, answers } = req.body as SubmitAttemptInput;

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, isPublished: true },
    include: {
      questions: {
        include: { choices: { select: { id: true, isCorrect: true } } },
      },
    },
  });

  if (!quiz) {
    throw ApiError.notFound('Quiz not found or not published');
  }
  if (quiz.questions.length === 0) {
    throw ApiError.badRequest('This quiz has no questions');
  }

  // Index correct choices per question for O(1) grading.
  const questionMap = new Map(
    quiz.questions.map((q) => [
      q.id,
      {
        points: q.points,
        correctChoiceId: q.choices.find((c) => c.isCorrect)?.id ?? null,
        validChoiceIds: new Set(q.choices.map((c) => c.id)),
      },
    ])
  );

  // Only keep answers that reference questions belonging to this quiz.
  const submittedByQuestion = new Map<string, string | null>();
  for (const answer of answers) {
    if (questionMap.has(answer.questionId)) {
      submittedByQuestion.set(answer.questionId, answer.choiceId);
    }
  }

  let score = 0;
  let correctAnswers = 0;
  const answerRows: {
    questionId: string;
    choiceId: string | null;
    isCorrect: boolean;
  }[] = [];

  for (const [questionId, meta] of questionMap) {
    const chosen = submittedByQuestion.get(questionId) ?? null;
    // Guard against a choiceId that doesn't belong to this question.
    const normalizedChoice =
      chosen && meta.validChoiceIds.has(chosen) ? chosen : null;
    const isCorrect =
      normalizedChoice !== null && normalizedChoice === meta.correctChoiceId;

    if (isCorrect) {
      score += meta.points;
      correctAnswers += 1;
    }

    answerRows.push({
      questionId,
      choiceId: normalizedChoice,
      isCorrect,
    });
  }

  const totalQuestions = quiz.questions.length;

  const attempt = await prisma.attempt.create({
    data: {
      quizId,
      nickname: nickname.trim(),
      score,
      correctAnswers,
      totalQuestions,
      timeSpent,
      answers: { create: answerRows },
    },
  });

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  res.status(201).json({
    attemptId: attempt.id,
    quizId,
    nickname: attempt.nickname,
    score,
    totalPoints,
    correctAnswers,
    totalQuestions,
    timeSpent,
    submittedAt: attempt.submittedAt,
    // Per-question correctness so the result screen can show a review
    // WITHOUT the player having seen answers beforehand.
    breakdown: answerRows.map((row) => ({
      questionId: row.questionId,
      choiceId: row.choiceId,
      isCorrect: row.isCorrect,
      correctChoiceId: questionMap.get(row.questionId)!.correctChoiceId,
    })),
  });
}

/** PUBLIC: fetch a single attempt result by id (e.g. on refresh of result page). */
export async function getAttempt(req: Request, res: Response) {
  const { id } = req.params;

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: { quiz: { select: { title: true } } },
  });

  if (!attempt) throw ApiError.notFound('Attempt not found');

  res.json({
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    nickname: attempt.nickname,
    score: attempt.score,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    timeSpent: attempt.timeSpent,
    submittedAt: attempt.submittedAt,
  });
}
