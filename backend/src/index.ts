import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './prisma.js';

async function main() {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`🚀 Quiz Platform API running on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
