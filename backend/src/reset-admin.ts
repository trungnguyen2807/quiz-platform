import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Reset (or create) an admin's password.
//
// Usage:
//   node dist/reset-admin.js <username> <newPassword>     (production, compiled)
//   npm run admin:reset -- <username> <newPassword>        (local, via tsx)
//
// If args are omitted it falls back to ADMIN_USERNAME / ADMIN_PASSWORD env vars.
// Point DATABASE_URL at the target database, e.g.:
//   DATABASE_URL="<neon-url>" npm run admin:reset -- nguyen 'NewStr0ngPass!'
const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2] ?? process.env.ADMIN_USERNAME;
  const password = process.argv[3] ?? process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error(
      'Usage: node dist/reset-admin.js <username> <newPassword>\n' +
        '(or set ADMIN_USERNAME and ADMIN_PASSWORD env vars)'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: { password: passwordHash }, // <-- unlike the seed, this DOES update
    create: { username, password: passwordHash },
  });

  console.log(`✔ Password set for admin "${admin.username}".`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Failed to reset admin password:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
