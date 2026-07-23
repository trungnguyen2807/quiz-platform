import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchQuizzes } from '../../api/public';
import { DifficultyBadge, Spinner } from '../../components/ui';

export default function HomePage() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => fetchQuizzes(),
  });

  const featured = quizzes?.slice(0, 3) ?? [];

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Test your knowledge. No sign-up required.
          </h1>
          <p className="mt-4 text-lg text-brand-100">
            Pick a quiz, enter a nickname, and race to the top of the leaderboard.
            Fast, simple, and fun.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/quizzes" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Browse quizzes
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Featured quizzes</h2>
          <Link to="/quizzes" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <Spinner />
        ) : featured.length === 0 ? (
          <p className="text-sm text-slate-500">No quizzes are available yet. Check back soon!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((quiz) => (
              <Link
                key={quiz.id}
                to={`/quizzes/${quiz.id}`}
                className="card group p-5 transition-shadow hover:shadow-md"
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
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{quiz.description}</p>
                )}
                <p className="mt-4 text-xs text-slate-400">
                  {quiz.questionCount} questions · {quiz.attemptCount} plays
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
