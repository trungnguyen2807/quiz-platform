import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QuizFormInput } from '../types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  timeLimit: z.coerce.number().int().min(0).max(36000),
});

type FormValues = z.infer<typeof schema>;

export default function QuizForm({
  defaultValues,
  submitLabel,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<QuizFormInput>;
  submitLabel: string;
  onSubmit: (values: QuizFormInput) => void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      category: defaultValues?.category ?? '',
      difficulty: defaultValues?.difficulty ?? 'EASY',
      timeLimit: defaultValues?.timeLimit ?? 0,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          title: values.title,
          description: values.description || null,
          category: values.category || null,
          difficulty: values.difficulty,
          timeLimit: values.timeLimit,
        })
      )}
      className="space-y-4"
    >
      <div>
        <label className="label">Title</label>
        <input className="input" {...register('title')} />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[80px]" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <input className="input" placeholder="e.g. Science" {...register('category')} />
        </div>
        <div>
          <label className="label">Difficulty</label>
          <select className="input" {...register('difficulty')}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Time limit (seconds, 0 = no limit)</label>
        <input type="number" min={0} className="input" {...register('timeLimit')} />
        {errors.timeLimit && (
          <p className="mt-1 text-sm text-red-600">{errors.timeLimit.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
