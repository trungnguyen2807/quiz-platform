import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQuestion,
  deleteQuestion,
  fetchAdminQuiz,
  setPublish,
  updateQuestion,
  updateQuiz,
} from '../../api/admin';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  DifficultyBadge,
  ErrorState,
  PageHeader,
  Spinner,
} from '../../components/ui';
import Modal from '../../components/Modal';
import QuizForm from '../../components/QuizForm';
import QuestionForm, { QuestionFormValues } from '../../components/QuestionForm';
import { AdminQuestion, QuizFormInput } from '../../types';

export default function QuizEditorPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();

  const [editMetaOpen, setEditMetaOpen] = useState(false);
  const [questionModal, setQuestionModal] = useState<
    { mode: 'create' } | { mode: 'edit'; question: AdminQuestion } | null
  >(null);

  const { data: quiz, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'quiz', id],
    queryFn: () => fetchAdminQuiz(id),
    enabled: Boolean(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'quiz', id] });
    qc.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
  };

  const metaMutation = useMutation({
    mutationFn: (values: QuizFormInput) => updateQuiz(id, values),
    onSuccess: () => {
      setEditMetaOpen(false);
      invalidate();
    },
  });

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => setPublish(id, isPublished),
    onSuccess: invalidate,
  });

  const createQuestionMutation = useMutation({
    mutationFn: (values: QuestionFormValues) =>
      createQuestion({ quizId: id, ...values }),
    onSuccess: () => {
      setQuestionModal(null);
      invalidate();
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, values }: { questionId: string; values: QuestionFormValues }) =>
      updateQuestion(questionId, values),
    onSuccess: () => {
      setQuestionModal(null);
      invalidate();
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: invalidate,
  });

  if (isLoading) return <Spinner />;
  if (isError || !quiz) return <ErrorState message={getApiErrorMessage(error)} />;

  const handleQuestionSubmit = (values: QuestionFormValues) => {
    if (questionModal?.mode === 'edit') {
      updateQuestionMutation.mutate({ questionId: questionModal.question.id, values });
    } else {
      createQuestionMutation.mutate(values);
    }
  };

  const questionSubmitError =
    createQuestionMutation.error ?? updateQuestionMutation.error;

  return (
    <div>
      <Link to="/admin/quizzes" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to quizzes
      </Link>

      <div className="mt-3">
        <PageHeader
          title={quiz.title}
          subtitle={quiz.description ?? 'No description'}
          action={
            <div className="flex gap-2">
              <button
                onClick={() => publishMutation.mutate(!quiz.isPublished)}
                disabled={publishMutation.isPending}
                className="btn-secondary"
              >
                {quiz.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => setEditMetaOpen(true)} className="btn-secondary">
                Edit details
              </button>
              <button onClick={() => setQuestionModal({ mode: 'create' })} className="btn-primary">
                + Add question
              </button>
            </div>
          }
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <DifficultyBadge difficulty={quiz.difficulty} />
        <span
          className={
            quiz.isPublished
              ? 'badge bg-emerald-100 text-emerald-700'
              : 'badge bg-slate-100 text-slate-500'
          }
        >
          {quiz.isPublished ? 'Published' : 'Draft'}
        </span>
        {quiz.category && <span>Category: {quiz.category}</span>}
        <span>Time limit: {quiz.timeLimit > 0 ? `${quiz.timeLimit}s` : 'None'}</span>
        <span>{quiz.questions.length} questions</span>
      </div>

      {publishMutation.isError && (
        <div className="mb-4">
          <ErrorState message={getApiErrorMessage(publishMutation.error)} />
        </div>
      )}

      {quiz.questions.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-semibold text-slate-700">No questions yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add questions before publishing this quiz.
          </p>
          <button
            onClick={() => setQuestionModal({ mode: 'create' })}
            className="btn-primary mt-4"
          >
            + Add question
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-brand-600">
                    Question {index + 1} · {question.points}{' '}
                    {question.points === 1 ? 'pt' : 'pts'}
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{question.content}</p>
                  <ul className="mt-3 space-y-1">
                    {question.choices.map((choice) => (
                      <li
                        key={choice.id}
                        className={
                          choice.isCorrect
                            ? 'flex items-center gap-2 text-sm font-medium text-emerald-700'
                            : 'flex items-center gap-2 text-sm text-slate-600'
                        }
                      >
                        <span>{choice.isCorrect ? '✓' : '•'}</span>
                        {choice.content}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    onClick={() => setQuestionModal({ mode: 'edit', question })}
                    className="btn-secondary px-2.5 py-1 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this question?')) {
                        deleteQuestionMutation.mutate(question.id);
                      }
                    }}
                    className="btn-danger px-2.5 py-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit metadata modal */}
      <Modal open={editMetaOpen} title="Edit quiz details" onClose={() => setEditMetaOpen(false)}>
        {metaMutation.isError && (
          <div className="mb-4">
            <ErrorState message={getApiErrorMessage(metaMutation.error)} />
          </div>
        )}
        <QuizForm
          submitLabel="Save changes"
          submitting={metaMutation.isPending}
          defaultValues={{
            title: quiz.title,
            description: quiz.description,
            category: quiz.category,
            difficulty: quiz.difficulty,
            timeLimit: quiz.timeLimit,
          }}
          onSubmit={(values) => metaMutation.mutate(values)}
        />
      </Modal>

      {/* Question create/edit modal */}
      <Modal
        open={questionModal !== null}
        title={questionModal?.mode === 'edit' ? 'Edit question' : 'Add question'}
        onClose={() => setQuestionModal(null)}
      >
        {questionSubmitError && (
          <div className="mb-4">
            <ErrorState message={getApiErrorMessage(questionSubmitError)} />
          </div>
        )}
        {questionModal && (
          <QuestionForm
            question={questionModal.mode === 'edit' ? questionModal.question : undefined}
            onSubmit={handleQuestionSubmit}
            submitting={
              createQuestionMutation.isPending || updateQuestionMutation.isPending
            }
          />
        )}
      </Modal>
    </div>
  );
}
