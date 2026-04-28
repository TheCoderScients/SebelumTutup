import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { initRealtime } from './realtime/socket.js';

const app = createApp();
const server = http.createServer(app);

initRealtime(server);

server.listen(env.PORT, () => {
  console.log(`[server] ${env.SITE_NAME} jalan di port ${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`[server] menerima ${signal}, shutdown...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
