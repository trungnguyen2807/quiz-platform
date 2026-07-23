import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminQuestion } from '../types';

const schema = z
  .object({
    content: z.string().min(1, 'Question text is required').max(1000),
    points: z.coerce.number().int().min(1).max(100),
    choices: z
      .array(
        z.object({
          content: z.string().min(1, 'Choice text is required').max(500),
          isCorrect: z.boolean(),
        })
      )
      .min(2, 'At least 2 choices are required')
      .max(6, 'At most 6 choices'),
  })
  .refine((q) => q.choices.some((c) => c.isCorrect), {
    message: 'Mark one choice as correct',
    path: ['choices'],
  });

type FormValues = z.infer<typeof schema>;

export interface QuestionFormValues {
  content: string;
  points: number;
  choices: { content: string; isCorrect: boolean }[];
}

export default function QuestionForm({
  question,
  onSubmit,
  submitting,
}: {
  question?: AdminQuestion;
  onSubmit: (values: QuestionFormValues) => void;
  submitting?: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      content: question?.content ?? '',
      points: question?.points ?? 1,
      choices:
        question?.choices.map((c) => ({ content: c.content, isCorrect: c.isCorrect })) ?? [
          { content: '', isCorrect: true },
          { content: '', isCorrect: false },
        ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'choices' });
  const choices = watch('choices');

  // Single-correct model: selecting one clears the others.
  const setCorrect = (index: number) => {
    choices.forEach((_, i) => setValue(`choices.${i}.isCorrect`, i === index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Question</label>
        <textarea className="input min-h-[70px]" {...register('content')} />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
      </div>

      <div className="w-32">
        <label className="label">Points</label>
        <input type="number" min={1} className="input" {...register('points')} />
        {errors.points && <p className="mt-1 text-sm text-red-600">{errors.points.message}</p>}
      </div>

      <div>
        <label className="label">Choices (select the correct one)</label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={choices[index]?.isCorrect ?? false}
                onChange={() => setCorrect(index)}
                className="h-4 w-4 text-brand-600"
                title="Mark as correct"
              />
              <input
                className="input"
                placeholder={`Choice ${index + 1}`}
                {...register(`choices.${index}.content`)}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length <= 2}
                className="btn-secondary px-2 py-2 text-xs disabled:opacity-40"
                title="Remove choice"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {errors.choices && (
          <p className="mt-1 text-sm text-red-600">
            {errors.choices.message ?? errors.choices.root?.message}
          </p>
        )}
        {fields.length < 6 && (
          <button
            type="button"
            onClick={() => append({ content: '', isCorrect: false })}
            className="btn-secondary mt-2 px-3 py-1.5 text-xs"
          >
            + Add choice
          </button>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : 'Save question'}
        </button>
      </div>
    </form>
  );
}
