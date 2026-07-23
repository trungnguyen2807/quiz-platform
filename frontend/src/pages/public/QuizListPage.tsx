import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchQuizzes } from '../../api/public';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  DifficultyBadge,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from '../../components/ui';

const difficulties = ['ALL', 'EASY', 'MEDIUM', 'HARD'] as const;

export default function QuizListPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>('ALL');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['quizzes', 'all'],
    queryFn: () => fetchQuizzes(),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((q) => {
      const matchesSearch =
        !search ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        (q.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficulty === 'ALL' || q.difficulty === difficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [data, search, difficulty]);

  return (
    <div>
      <PageHeader title="Quizzes" subtitle="Choose a quiz and jump right in." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search quizzes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={
                difficulty === d
                  ? 'btn-primary px-3 py-1.5 text-xs'
                  : 'btn-secondary px-3 py-1.5 text-xs'
              }
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No quizzes found"
          description="Try adjusting your search or difficulty filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quiz) => (
            <Link
              key={quiz.id}
              to={`/quizzes/${quiz.id}`}
              className="card group flex flex-col p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <DifficultyBadge difficulty={quiz.difficulty} />
                {quiz.category && (
                  <span className="text-xs font-medium text-slate-400">{quiz.category}</span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-brand-700">
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
                  {quiz.description}
                </p>
              )}
              <p className="mt-4 text-xs text-slate-400">
                {quiz.questionCount} questions · {quiz.attemptCount} plays
                {quiz.timeLimit > 0 && ` · ${Math.round(quiz.timeLimit / 60)} min`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
