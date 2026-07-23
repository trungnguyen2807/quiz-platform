import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchDashboard } from '../../api/admin';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
  StatCard,
} from '../../components/ui';

export default function StatisticsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={getApiErrorMessage(error)} />;

  const chartData = data.quizStats
    .map((q) => ({
      name: q.title.length > 18 ? `${q.title.slice(0, 18)}…` : q.title,
      attempts: q.attempts,
      questions: q.questions,
    }))
    .slice(0, 12);

  return (
    <div>
      <PageHeader title="Statistics" subtitle="Platform engagement at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total quizzes" value={data.totals.quizzes} accent="text-brand-700" />
        <StatCard label="Total questions" value={data.totals.questions} />
        <StatCard label="Total attempts" value={data.totals.attempts} />
        <StatCard label="Average score" value={data.totals.averageScore} accent="text-emerald-600" />
      </div>

      <div className="card mt-6 p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Attempts per quiz</h3>
        {chartData.length === 0 || data.totals.attempts === 0 ? (
          <EmptyState
            title="No data to chart yet"
            description="Statistics appear once players start taking quizzes."
          />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="attempts" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card mt-6 overflow-hidden">
        <h3 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-700">
          Quiz breakdown
        </h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">Quiz</th>
              <th className="px-6 py-3 text-right">Questions</th>
              <th className="px-6 py-3 text-right">Attempts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.quizStats.map((q) => (
              <tr key={q.id}>
                <td className="px-6 py-3 font-medium text-slate-800">{q.title}</td>
                <td className="px-6 py-3 text-right text-slate-600">{q.questions}</td>
                <td className="px-6 py-3 text-right text-slate-600">{q.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
