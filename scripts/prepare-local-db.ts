import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import EmbeddedPostgres from 'embedded-postgres';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, '.local-db');
const port = 55432;
const user = 'sebel';
const password = 'sebel_password';
const database = 'sebelumtutup';
const databaseUrl = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;

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

function run(command: string, args: string[], env: Record<string, string>) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: { ...process.env, ...env },
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} gagal dengan code ${code}`));
    });
  });
}

async function main() {
  await fs.mkdir(dataDir, { recursive: true });
  const versionFile = path.join(dataDir, 'PG_VERSION');

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port,
    persistent: true
  });

  try {
    const clusterExists = await fs
      .access(versionFile)
      .then(() => true)
      .catch(() => false);

    if (!clusterExists) {
      await pg.initialise();
    }
    await pg.start();

    await ensureDatabase(pg, database);

    const env = { DATABASE_URL: databaseUrl };

    await run('npm', ['run', 'db:migrate'], env);
    await run('npm', ['run', 'db:seed'], env);

    console.log(`\n[db:local:prepare] siap. DATABASE_URL=${databaseUrl}`);
  } finally {
    await pg.stop().catch(() => undefined);
  }
}

void main().catch((error) => {
  console.error('[db:local:prepare] gagal', error);
  process.exit(1);
});
