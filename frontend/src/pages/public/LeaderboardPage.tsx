import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { fetchLeaderboard } from '../../api/public';
import { getApiErrorMessage } from '../../lib/apiClient';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui';
import { formatTime } from '../../lib/utils';

const medal = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { quizId = '' } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['leaderboard', quizId],
    queryFn: () => fetchLeaderboard(quizId),
    enabled: Boolean(quizId),
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={getApiErrorMessage(error)} />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Leaderboard"
        subtitle={data.quizTitle}
        action={
          <Link to={`/quizzes/${quizId}`} className="btn-primary">
            Play this quiz
          </Link>
        }
      />

      {data.entries.length === 0 ? (
        <EmptyState
          title="No attempts yet"
          description="Be the first to play and claim the top spot!"
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Nickname</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Correct</th>
                <th className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.entries.map((entry) => (
                <tr
                  key={entry.attemptId}
                  className={clsx(entry.rank <= 3 && 'bg-amber-50/40')}
                >
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">{medal[entry.rank - 1]}</span>
                    ) : (
                      entry.rank
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{entry.nickname}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-700">
                    {entry.score}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {entry.correctAnswers}/{entry.totalQuestions}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {formatTime(entry.timeSpent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
