import { api } from '../lib/apiClient';
import {
  AdminQuizDetail,
  AdminQuizSummary,
  AdminQuestion,
  DashboardData,
  QuestionFormInput,
  QuizFormInput,
} from '../types';

export async function adminLogin(
  username: string,
  password: string
): Promise<{ token: string; admin: { id: string; username: string } }> {
  const { data } = await api.post('/admin/login', { username, password });
  return data;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/admin/dashboard');
  return data;
}

export async function fetchAdminQuizzes(): Promise<AdminQuizSummary[]> {
  const { data } = await api.get<AdminQuizSummary[]>('/admin/quizzes');
  return data;
}

export async function fetchAdminQuiz(id: string): Promise<AdminQuizDetail> {
  const { data } = await api.get<AdminQuizDetail>(`/admin/quizzes/${id}`);
  return data;
}

export async function createQuiz(input: QuizFormInput): Promise<AdminQuizDetail> {
  const { data } = await api.post('/admin/quizzes', input);
  return data;
}

export async function updateQuiz(
  id: string,
  input: Partial<QuizFormInput>
): Promise<AdminQuizDetail> {
  const { data } = await api.put(`/admin/quizzes/${id}`, input);
  return data;
}

export async function setPublish(
  id: string,
  isPublished: boolean
): Promise<AdminQuizSummary> {
  const { data } = await api.patch(`/admin/quizzes/${id}/publish`, {
    isPublished,
  });
  return data;
}

export async function deleteQuiz(id: string): Promise<void> {
  await api.delete(`/admin/quizzes/${id}`);
}

export async function createQuestion(
  input: QuestionFormInput
): Promise<AdminQuestion> {
  const { data } = await api.post('/admin/questions', input);
  return data;
}

export async function updateQuestion(
  id: string,
  input: Omit<QuestionFormInput, 'quizId'>
): Promise<AdminQuestion> {
  const { data } = await api.put(`/admin/questions/${id}`, input);
  return data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await api.delete(`/admin/questions/${id}`);
}
