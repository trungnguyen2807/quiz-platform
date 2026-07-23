import { api } from '../lib/apiClient';
import {
  AttemptResult,
  Leaderboard,
  PublicQuiz,
  QuizSummary,
  SubmitAttemptPayload,
} from '../types';

export async function fetchQuizzes(params?: {
  category?: string;
  difficulty?: string;
  search?: string;
}): Promise<QuizSummary[]> {
  const { data } = await api.get<QuizSummary[]>('/quizzes', { params });
  return data;
}

export async function fetchQuiz(id: string): Promise<PublicQuiz> {
  const { data } = await api.get<PublicQuiz>(`/quizzes/${id}`);
  return data;
}

export async function submitAttempt(
  payload: SubmitAttemptPayload
): Promise<AttemptResult> {
  const { data } = await api.post<AttemptResult>('/attempt', payload);
  return data;
}

export async function fetchLeaderboard(quizId: string): Promise<Leaderboard> {
  const { data } = await api.get<Leaderboard>(`/leaderboard/${quizId}`);
  return data;
}

export interface BasicAttempt {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  submittedAt: string;
}

export async function fetchAttempt(id: string): Promise<BasicAttempt> {
  const { data } = await api.get<BasicAttempt>(`/attempt/${id}`);
  return data;
}
