import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type Part = 'body' | 'query' | 'params';

/** Validates a request part against a Zod schema and replaces it with the parsed value. */
export function validate(schema: ZodSchema, part: Part = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(
        ApiError.badRequest('Validation failed', result.error.flatten())
      );
    }
    // Reassign the parsed (typed/coerced) value.
    req[part] = result.data;
    return next();
  };
}
