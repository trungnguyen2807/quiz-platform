import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { fetchQuiz, submitAttempt } from '../../api/public';
import { getApiErrorMessage } from '../../lib/apiClient';
import { ErrorState, Spinner } from '../../components/ui';
import { formatTime, nicknameStore } from '../../lib/utils';

export default function PlayQuizPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const nickname = nicknameStore.get();

  const { data: quiz, isLoading, isError, error } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => fetchQuiz(id),
    enabled: Boolean(id),
  });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const submittedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: submitAttempt,
    onSuccess: (result) => {
      // Persist so the result page survives a refresh.
      sessionStorage.setItem(`attempt_${result.attemptId}`, JSON.stringify(result));
      navigate(`/result/${result.attemptId}`, { state: { result } });
    },
  });

  const handleSubmit = () => {
    if (submittedRef.current || !quiz) return;
    submittedRef.current = true;
    mutation.mutate({
      quizId: quiz.id,
      nickname: nickname || 'Anonymous',
      timeSpent: elapsed,
      answers: quiz.questions.map((q) => ({
        questionId: q.id,
        choiceId: answers[q.id] ?? null,
      })),
    });
  };

  // Elapsed timer (counts up always; also drives the countdown display).
  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeLimit = quiz?.timeLimit ?? 0;
  const remaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : null;

  // Auto-submit when the countdown reaches zero.
  useEffect(() => {
    if (remaining === 0 && !submittedRef.current) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  // No nickname -> send them back to pick one.
  useEffect(() => {
    if (!nickname) navigate(`/quizzes/${id}`, { replace: true });
  }, [nickname, id, navigate]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  if (isLoading) return <div className="mx-auto max-w-2xl px-4 py-10"><Spinner /></div>;
  if (isError || !quiz)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ErrorState message={getApiErrorMessage(error, 'Quiz not found')} />
      </div>
    );

  const question = quiz.questions[current];
  const isLast = current === quiz.questions.length - 1;
  const progress = ((current + 1) / quiz.questions.length) * 100;

  const selectChoice = (choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: choiceId }));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">{quiz.title}</span>
            <div className="flex items-center gap-4">
              <span className="text-slate-500">
                {answeredCount}/{quiz.questions.length} answered
              </span>
              <span
                className={clsx(
                  'rounded-md px-2 py-1 font-mono font-semibold',
                  remaining !== null && remaining <= 10
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-700'
                )}
              >
                {remaining !== null ? formatTime(remaining) : formatTime(elapsed)}
              </span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm font-medium text-brand-600">
          Question {current + 1} of {quiz.questions.length}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{question.content}</h2>
        <p className="mt-1 text-xs text-slate-400">
          {question.points} {question.points === 1 ? 'point' : 'points'}
        </p>

        <div className="mt-6 space-y-3">
          {question.choices.map((choice, idx) => {
            const selected = answers[question.id] === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => selectChoice(choice.id)}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all',
                  selected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span
                  className={clsx(
                    'grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-sm font-semibold',
                    selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-slate-800">{choice.content}</span>
              </button>
            );
          })}
        </div>

        {mutation.isError && (
          <div className="mt-4">
            <ErrorState message={getApiErrorMessage(mutation.error, 'Failed to submit')} />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="btn-secondary"
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit quiz'}
            </button>
          ) : (
            <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">
              Next →
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {quiz.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrent(idx)}
              className={clsx(
                'h-8 w-8 rounded-lg text-xs font-semibold transition-colors',
                idx === current
                  ? 'bg-brand-600 text-white'
                  : answers[q.id]
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200'
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
