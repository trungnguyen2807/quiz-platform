import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAttempt } from '../../api/public';
import { AttemptResult } from '../../types';
import { ErrorState, Spinner } from '../../components/ui';
import { formatTime } from '../../lib/utils';

export default function ResultPage() {
  const { attemptId = '' } = useParams();
  const location = useLocation();

  // Prefer the rich result passed from the play screen (has per-question breakdown).
  const [result, setResult] = useState<AttemptResult | null>(
    (location.state as { result?: AttemptResult } | null)?.result ?? null
  );

  useEffect(() => {
    if (result) return;
    const cached = sessionStorage.getItem(`attempt_${attemptId}`);
    if (cached) {
      try {
        setResult(JSON.parse(cached) as AttemptResult);
      } catch {
        /* ignore corrupt cache */
      }
    }
  }, [attemptId, result]);

  // Fallback: fetch the basic attempt (no breakdown) if we have nothing cached.
  const { data: basic, isLoading, isError } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => fetchAttempt(attemptId),
    enabled: Boolean(attemptId) && !result,
  });

  const view = useMemo(() => {
    if (result) {
      return {
        quizId: result.quizId,
        nickname: result.nickname,
        score: result.score,
        totalPoints: result.totalPoints,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeSpent: result.timeSpent,
      };
    }
    if (basic) {
      return {
        quizId: basic.quizId,
        nickname: basic.nickname,
        score: basic.score,
        totalPoints: null as number | null,
        correctAnswers: basic.correctAnswers,
        totalQuestions: basic.totalQuestions,
        timeSpent: basic.timeSpent,
      };
    }
    return null;
  }, [result, basic]);

  if (!result && isLoading) return <Spinner />;
  if (!view && isError) return <ErrorState message="Could not load your result." />;
  if (!view) return <Spinner />;

  const pct =
    view.totalQuestions > 0
      ? Math.round((view.correctAnswers / view.totalQuestions) * 100)
      : 0;

  const message =
    pct >= 80 ? 'Outstanding! 🏆' : pct >= 50 ? 'Nice work! 👏' : 'Keep practicing! 💪';

  return (
    <div className="mx-auto max-w-xl">
      <div className="card overflow-hidden text-center">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-10 text-white">
          <p className="text-sm text-brand-100">Results for</p>
          <p className="text-2xl font-bold">{view.nickname}</p>
          <div className="mt-6 inline-flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white/10 ring-4 ring-white/20">
            <span className="text-4xl font-bold">{pct}%</span>
            <span className="text-xs text-brand-100">score</span>
          </div>
          <p className="mt-4 text-lg font-medium">{message}</p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <Stat label="Points" value={view.totalPoints !== null ? `${view.score}/${view.totalPoints}` : view.score} />
          <Stat label="Correct" value={`${view.correctAnswers}/${view.totalQuestions}`} />
          <Stat label="Time" value={formatTime(view.timeSpent)} />
        </div>

        <div className="flex flex-col gap-3 p-6 sm:flex-row">
          <Link to={`/leaderboard/${view.quizId}`} className="btn-primary flex-1">
            View leaderboard
          </Link>
          <Link to={`/quizzes/${view.quizId}`} className="btn-secondary flex-1">
            Play again
          </Link>
          <Link to="/quizzes" className="btn-secondary flex-1">
            More quizzes
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-5">
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
