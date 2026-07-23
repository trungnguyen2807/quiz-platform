import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { signAdminToken } from '../utils/jwt.js';
import { LoginInput } from '../validators/schemas.js';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginInput;

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  const token = signAdminToken({ sub: admin.id, username: admin.username });

  res.json({
    token,
    admin: { id: admin.id, username: admin.username },
  });
}
