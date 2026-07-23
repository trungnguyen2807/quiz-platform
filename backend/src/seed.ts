import { PrismaClient, Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// This file lives under src/ so `tsc` compiles it to dist/seed.js, which lets
// production environments seed with plain `node dist/seed.js` (no tsx / dev deps).
const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: {},
    create: { username, password: passwordHash },
  });

  console.log(`✔ Admin ready: ${admin.username}`);

  // Only seed demo content if there are no quizzes yet.
  const existingQuizzes = await prisma.quiz.count();
  if (existingQuizzes > 0) {
    console.log('✔ Quizzes already exist, skipping demo seed.');
    return;
  }

  const generalKnowledge = await prisma.quiz.create({
    data: {
      title: 'General Knowledge Starter',
      description: 'A quick warm-up quiz covering a bit of everything.',
      category: 'General',
      difficulty: Difficulty.EASY,
      timeLimit: 120,
      isPublished: true,
      createdBy: admin.id,
      questions: {
        create: [
          {
            content: 'What is the capital of France?',
            points: 1,
            order: 1,
            choices: {
              create: [
                { content: 'Berlin', isCorrect: false },
                { content: 'Paris', isCorrect: true },
                { content: 'Madrid', isCorrect: false },
                { content: 'Rome', isCorrect: false },
              ],
            },
          },
          {
            content: 'How many continents are there on Earth?',
            points: 1,
            order: 2,
            choices: {
              create: [
                { content: '5', isCorrect: false },
                { content: '6', isCorrect: false },
                { content: '7', isCorrect: true },
                { content: '8', isCorrect: false },
              ],
            },
          },
          {
            content: 'Which planet is known as the Red Planet?',
            points: 1,
            order: 3,
            choices: {
              create: [
                { content: 'Venus', isCorrect: false },
                { content: 'Mars', isCorrect: true },
                { content: 'Jupiter', isCorrect: false },
                { content: 'Saturn', isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  const webDev = await prisma.quiz.create({
    data: {
      title: 'Web Development Basics',
      description: 'Test your knowledge of the fundamentals of the web.',
      category: 'Programming',
      difficulty: Difficulty.MEDIUM,
      timeLimit: 180,
      isPublished: true,
      createdBy: admin.id,
      questions: {
        create: [
          {
            content: 'What does HTML stand for?',
            points: 2,
            order: 1,
            choices: {
              create: [
                { content: 'Hyper Text Markup Language', isCorrect: true },
                { content: 'High Tech Modern Language', isCorrect: false },
                { content: 'Hyperlinks and Text Markup Language', isCorrect: false },
                { content: 'Home Tool Markup Language', isCorrect: false },
              ],
            },
          },
          {
            content: 'Which HTTP method is typically used to create a resource?',
            points: 2,
            order: 2,
            choices: {
              create: [
                { content: 'GET', isCorrect: false },
                { content: 'POST', isCorrect: true },
                { content: 'DELETE', isCorrect: false },
                { content: 'HEAD', isCorrect: false },
              ],
            },
          },
          {
            content: 'In CSS, which property controls the text size?',
            points: 1,
            order: 3,
            choices: {
              create: [
                { content: 'font-weight', isCorrect: false },
                { content: 'text-style', isCorrect: false },
                { content: 'font-size', isCorrect: true },
                { content: 'text-size', isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✔ Seeded quizzes: ${generalKnowledge.title}, ${webDev.title}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
