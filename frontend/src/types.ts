export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  timeLimit: number;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
}

export interface PublicChoice {
  id: string;
  content: string;
}

export interface PublicQuestion {
  id: string;
  content: string;
  points: number;
  order: number;
  choices: PublicChoice[];
}

export interface PublicQuiz {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  timeLimit: number;
  totalQuestions: number;
  totalPoints: number;
  questions: PublicQuestion[];
}

export interface SubmitAttemptPayload {
  quizId: string;
  nickname: string;
  timeSpent: number;
  answers: { questionId: string; choiceId: string | null }[];
}

export interface AttemptBreakdown {
  questionId: string;
  choiceId: string | null;
  isCorrect: boolean;
  correctChoiceId: string | null;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  nickname: string;
  score: number;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  submittedAt: string;
  breakdown: AttemptBreakdown[];
}

export interface LeaderboardEntry {
  rank: number;
  attemptId: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  submittedAt: string;
}

export interface Leaderboard {
  quizId: string;
  quizTitle: string;
  entries: LeaderboardEntry[];
}

// ---- Admin ----
export interface AdminChoice {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
}

export interface AdminQuestion {
  id: string;
  quizId: string;
  content: string;
  points: number;
  order: number;
  choices: AdminChoice[];
}

export interface AdminQuizSummary {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  timeLimit: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  attemptCount: number;
}

export interface AdminQuizDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  timeLimit: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions: AdminQuestion[];
}

export interface QuizFormInput {
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty: Difficulty;
  timeLimit: number;
  isPublished?: boolean;
}

export interface QuestionFormInput {
  quizId: string;
  content: string;
  points: number;
  order?: number;
  choices: { content: string; isCorrect: boolean }[];
}

export interface DashboardData {
  totals: {
    quizzes: number;
    questions: number;
    attempts: number;
    averageScore: number;
  };
  mostPlayed: { id: string; title: string; attempts: number } | null;
  recentAttempts: {
    id: string;
    quizId: string;
    quizTitle: string;
    nickname: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    submittedAt: string;
  }[];
  quizStats: { id: string; title: string; attempts: number; questions: number }[];
}
