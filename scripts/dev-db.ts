import fs from 'fs/promises';
import path from 'path';
import EmbeddedPostgres from 'embedded-postgres';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, '.local-db');
const port = Number(process.env.LOCAL_PG_PORT || 55432);
const user = process.env.LOCAL_PG_USER || 'sebel';
const password = process.env.LOCAL_PG_PASSWORD || 'sebel_password';
const database = process.env.LOCAL_PG_DB || 'sebelumtutup';

async function ensureDatabase(pg: EmbeddedPostgres, name: string) {
  const client = pg.getPgClient();
  await client.connect();
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1', [name]);
    if (result.rowCount === 0) {
      await pg.createDatabase(name);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  await fs.mkdir(dataDir, { recursive: true });
  const versionFile = path.join(dataDir, 'PG_VERSION');
  let shuttingDown = false;

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port,
    persistent: true
  });

  const clusterExists = await fs
    .access(versionFile)
    .then(() => true)
    .catch(() => false);

  if (!clusterExists) {
    await pg.initialise();
  }
  await pg.start();
  await ensureDatabase(pg, database);

  const databaseUrl = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;

  console.log(`[local-db] PostgreSQL embedded aktif di port ${port}`);
  console.log(`[local-db] DATABASE_URL=${databaseUrl}`);
  console.log('[local-db] Tekan Ctrl+C untuk stop.');

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n[local-db] shutdown...');
    await pg.stop().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Connection terminated unexpectedly')) {
        throw error;
      }
    });
    process.exit(0);
  };

  process.on('uncaughtException', (error) => {
    if (shuttingDown && error.message.includes('Connection terminated unexpectedly')) {
      return;
    }
    console.error(error);
    process.exit(1);
  });

  process.on('unhandledRejection', (error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (shuttingDown && message.includes('Connection terminated unexpectedly')) {
      return;
    }
    console.error(error);
    process.exit(1);
  });

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void main().catch((error) => {
  console.error('[local-db] gagal start', error);
  process.exit(1);
});
