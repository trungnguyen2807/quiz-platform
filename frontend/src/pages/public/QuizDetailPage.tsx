import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchQuiz } from '../../api/public';
import { getApiErrorMessage } from '../../lib/apiClient';
import { DifficultyBadge, ErrorState, Spinner } from '../../components/ui';
import { nicknameStore } from '../../lib/utils';

export default function QuizDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(() => nicknameStore.get());
  const [touched, setTouched] = useState(false);

  const { data: quiz, isLoading, isError, error } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => fetchQuiz(id),
    enabled: Boolean(id),
  });

  const handleStart = () => {
    setTouched(true);
    const trimmed = nickname.trim();
    if (!trimmed) return;
    nicknameStore.set(trimmed);
    navigate(`/play/${id}`);
  };

  if (isLoading) return <Spinner />;
  if (isError || !quiz) return <ErrorState message={getApiErrorMessage(error, 'Quiz not found')} />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/quizzes" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to quizzes
      </Link>

      <div className="card mt-4 p-8">
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={quiz.difficulty} />
          {quiz.category && (
            <span className="text-sm font-medium text-slate-400">{quiz.category}</span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-slate-600">{quiz.description}</p>}

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-900">{quiz.totalQuestions}</p>
            <p className="text-xs text-slate-500">Questions</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-900">{quiz.totalPoints}</p>
            <p className="text-xs text-slate-500">Points</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-900">
              {quiz.timeLimit > 0 ? `${Math.round(quiz.timeLimit / 60)}m` : '∞'}
            </p>
            <p className="text-xs text-slate-500">Time limit</p>
          </div>
        </div>

        <div className="mt-8">
          <label className="label" htmlFor="nickname">
            Enter your nickname to start
          </label>
          <div className="flex gap-2">
            <input
              id="nickname"
              className="input"
              placeholder="e.g. QuizWizard"
              maxLength={50}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
            <button onClick={handleStart} className="btn-primary whitespace-nowrap">
              Start quiz
            </button>
          </div>
          {touched && !nickname.trim() && (
            <p className="mt-1 text-sm text-red-600">Please enter a nickname.</p>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link
            to={`/leaderboard/${quiz.id}`}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
