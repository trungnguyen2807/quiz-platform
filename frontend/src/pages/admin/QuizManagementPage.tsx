import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQuiz,
  deleteQuiz,
  fetchAdminQuizzes,
  setPublish,
} from '../../api/admin';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  DifficultyBadge,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from '../../components/ui';
import Modal from '../../components/Modal';
import QuizForm from '../../components/QuizForm';
import { QuizFormInput } from '../../types';

export default function QuizManagementPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'quizzes'],
    queryFn: fetchAdminQuizzes,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
    qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      setCreateOpen(false);
      invalidate();
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      setPublish(id, isPublished),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: invalidate,
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This removes all its questions and attempts.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = (values: QuizFormInput) => createMutation.mutate(values);

  return (
    <div>
      <PageHeader
        title="Quiz Management"
        subtitle="Create, edit, publish and delete quizzes"
        action={
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            + New quiz
          </button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No quizzes yet"
          description="Create your first quiz to get started."
          action={
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              + New quiz
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3 text-center">Questions</th>
                <th className="px-4 py-3 text-center">Attempts</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((quiz) => (
                <tr key={quiz.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/quizzes/${quiz.id}`}
                      className="font-medium text-slate-900 hover:text-brand-700"
                    >
                      {quiz.title}
                    </Link>
                    {quiz.category && (
                      <span className="ml-2 text-xs text-slate-400">{quiz.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={quiz.difficulty} />
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{quiz.questionCount}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{quiz.attemptCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        quiz.isPublished
                          ? 'badge bg-emerald-100 text-emerald-700'
                          : 'badge bg-slate-100 text-slate-500'
                      }
                    >
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          publishMutation.mutate({
                            id: quiz.id,
                            isPublished: !quiz.isPublished,
                          })
                        }
                        disabled={publishMutation.isPending}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        {quiz.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link
                        to={`/admin/quizzes/${quiz.id}`}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(quiz.id, quiz.title)}
                        className="btn-danger px-2.5 py-1 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(publishMutation.isError || deleteMutation.isError) && (
        <div className="mt-4">
          <ErrorState
            message={getApiErrorMessage(publishMutation.error ?? deleteMutation.error)}
          />
        </div>
      )}

      <Modal open={createOpen} title="Create quiz" onClose={() => setCreateOpen(false)}>
        {createMutation.isError && (
          <div className="mb-4">
            <ErrorState message={getApiErrorMessage(createMutation.error)} />
          </div>
        )}
        <QuizForm
          submitLabel="Create quiz"
          onSubmit={handleCreate}
          submitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
