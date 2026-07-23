import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../../api/admin';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  ErrorState,
  PageHeader,
  Spinner,
  StatCard,
} from '../../components/ui';
import { formatDate, formatTime } from '../../lib/utils';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={getApiErrorMessage(error)} />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your quiz platform"
        action={
          <Link to="/admin/quizzes" className="btn-primary">
            Manage quizzes
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total quizzes" value={data.totals.quizzes} accent="text-brand-700" />
        <StatCard label="Total questions" value={data.totals.questions} />
        <StatCard label="Total attempts" value={data.totals.attempts} />
        <StatCard label="Average score" value={data.totals.averageScore} accent="text-emerald-600" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-500">Most played quiz</h3>
          {data.mostPlayed ? (
            <div className="mt-3">
              <Link
                to={`/admin/quizzes/${data.mostPlayed.id}`}
                className="text-lg font-bold text-slate-900 hover:text-brand-700"
              >
                {data.mostPlayed.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {data.mostPlayed.attempts} attempts
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No attempts yet.</p>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-500">Recent attempts</h3>
          {data.recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-400">No attempts recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-2">Player</th>
                    <th className="pb-2">Quiz</th>
                    <th className="pb-2 text-right">Score</th>
                    <th className="pb-2 text-right">Time</th>
                    <th className="pb-2 text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentAttempts.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 font-medium text-slate-800">{a.nickname}</td>
                      <td className="py-2 text-slate-600">{a.quizTitle}</td>
                      <td className="py-2 text-right font-semibold text-brand-700">
                        {a.score}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        {formatTime(a.timeSpent)}
                      </td>
                      <td className="py-2 text-right text-xs text-slate-400">
                        {formatDate(a.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
