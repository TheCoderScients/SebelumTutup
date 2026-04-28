import fs from 'fs/promises';
import path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import net from 'net';
import EmbeddedPostgres from 'embedded-postgres';
import { io as ioClient } from 'socket.io-client';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, '.smoke-db');
const user = 'sebel';
const password = 'sebel_password';
const database = 'sebelumtutup';

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAvailablePort(preferredPort: number) {
  const tryPort = (port: number) =>
    new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on('error', reject);
      server.listen(port, '127.0.0.1', () => {
        const address = server.address();
        const result = typeof address === 'object' && address ? address.port : port;
        server.close(() => resolve(result));
      });
    });

  try {
    return await tryPort(preferredPort);
  } catch {
    return tryPort(0);
  }
}

function spawnCommand(command: string, args: string[], env: Record<string, string>) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

  return child;
}

async function waitForHealth(url: string, timeoutMs: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error(`Timeout menunggu ${url}`);
}

async function run(command: string, args: string[], env: Record<string, string>) {
  await new Promise<void>((resolve, reject) => {
    const child = spawnCommand(command, args, env);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} gagal dengan code ${code}`));
    });
  });
}

async function stopChild(child: ChildProcess) {
  await new Promise<void>((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    child.once('exit', () => finish());

    if (!child.killed) {
      child.kill('SIGINT');
    }

    setTimeout(() => {
      if (!done && child.pid) {
        child.kill('SIGTERM');
      }
      setTimeout(() => {
        if (!done && child.pid) {
          child.kill('SIGKILL');
        }
        finish();
      }, 2_000);
    }, 4_000);
  });
}

async function main() {
  await fs.rm(dataDir, { recursive: true, force: true });
  await fs.mkdir(dataDir, { recursive: true });

  const pgPort = await getAvailablePort(55439);
  const appPort = await getAvailablePort(4110);
  const baseUrl = `http://127.0.0.1:${appPort}`;
  const databaseUrl = `postgresql://${user}:${password}@127.0.0.1:${pgPort}/${database}?schema=public`;

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port: pgPort,
    persistent: false
  });

  let serverProcess: ChildProcess | null = null;

  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase(database);

    const env = {
      DATABASE_URL: databaseUrl,
      NODE_ENV: 'production',
      PORT: String(appPort),
      CLIENT_ORIGIN: `http://127.0.0.1:${appPort}`,
      SITE_NAME: 'SebelumTutup',
      SITE_CLOSE_AT: '2026-05-22T23:59:59+07:00',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'change-me-admin',
      SESSION_SECRET: 'local-session-secret-32-characters',
      COOKIE_SECRET: 'local-cookie-secret-32-characters',
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX_POSTS: '50',
      RATE_LIMIT_MAX_COMMENTS: '50',
      RATE_LIMIT_MAX_REPORTS: '50'
    };

    await run('npm', ['run', 'db:migrate'], env);
    await run('npm', ['run', 'db:seed'], env);
    await run('npm', ['run', 'build'], env);

    serverProcess = spawn(process.execPath, ['server/dist/index.js'], {
      cwd: rootDir,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    serverProcess.stdout.on('data', (chunk) => process.stdout.write(chunk));
    serverProcess.stderr.on('data', (chunk) => process.stderr.write(chunk));
    await waitForHealth(`${baseUrl}/health`, 30_000);

    const guestCookieJar: string[] = [];
    const adminCookieJar: string[] = [];

    async function request(pathname: string, init: RequestInit = {}, cookieJar = guestCookieJar) {
      const headers = new Headers(init.headers);
      if (init.body && !headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      if (cookieJar.length) {
        headers.set('cookie', cookieJar.join('; '));
      }

      const response = await fetch(`${baseUrl}${pathname}`, {
        ...init,
        headers,
        redirect: 'manual'
      });

      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const nextCookie = setCookie.split(';')[0];
        const name = nextCookie.split('=')[0];
        const existingIndex = cookieJar.findIndex((cookie) => cookie.startsWith(`${name}=`));
        if (existingIndex >= 0) cookieJar.splice(existingIndex, 1, nextCookie);
        else cookieJar.push(nextCookie);
      }

      const payload = await response.json().catch(() => null);
      return { response, payload };
    }

    const health = await request('/health');
    if (!health.response.ok) throw new Error('health gagal');

    const pagePaths = ['/', '/feed', '/admin'];
    for (const pagePath of pagePaths) {
      const pageResponse = await fetch(`${baseUrl}${pagePath}`);
      if (!pageResponse.ok || !(pageResponse.headers.get('content-type') || '').includes('text/html')) {
        throw new Error(`halaman ${pagePath} gagal disajikan`);
      }
    }

    const bootstrap = await request('/api/guest/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ nickname: 'TesterLokal', isAnonymous: false })
    });
    if (!bootstrap.response.ok || !bootstrap.payload?.success) throw new Error('guest bootstrap gagal');

    const statsBefore = await request('/api/site/stats');
    if (!statsBefore.response.ok || !statsBefore.payload?.data?.stats?.posts) {
      throw new Error('site stats awal gagal');
    }

    const createPost = await request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Smoke test post',
        body: 'Ini post yang dibuat oleh smoke test end-to-end.',
        category: 'teknologi',
        displayMode: 'nickname'
      })
    });
    if (!createPost.response.ok || !createPost.payload?.data?.id) throw new Error('create post gagal');
    const postId = createPost.payload.data.id as string;

    const postPage = await fetch(`${baseUrl}/post/${postId}`);
    if (!postPage.ok || !(postPage.headers.get('content-type') || '').includes('text/html')) {
      throw new Error('halaman detail post gagal disajikan');
    }

    const socketEvent = await new Promise<{ count: number }>((resolve, reject) => {
      const socket = ioClient(baseUrl, {
        transports: ['websocket'],
        extraHeaders: guestCookieJar.length ? { Cookie: guestCookieJar.join('; ') } : undefined
      });

      const timer = setTimeout(() => {
        socket.close();
        reject(new Error('socket online_count timeout'));
      }, 10_000);

      socket.on('site:online_count', (payload) => {
        clearTimeout(timer);
        socket.close();
        resolve(payload);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        socket.close();
        reject(error);
      });
    });

    if (typeof socketEvent.count !== 'number') throw new Error('socket payload tidak valid');

    const comment = await request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body: 'Komentar dari smoke test.',
        displayMode: 'nickname'
      })
    });
    if (!comment.response.ok || !comment.payload?.data?.comment?.id) throw new Error('create comment gagal');
    const commentId = comment.payload.data.comment.id as string;

    const reaction = await request(`/api/posts/${postId}/reactions/toggle`, {
      method: 'POST',
      body: JSON.stringify({ emoji: '🔥' })
    });
    if (!reaction.response.ok || !reaction.payload?.data?.active) throw new Error('toggle reaction gagal');

    const vote = await request(`/api/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value: 1 })
    });
    if (!vote.response.ok || vote.payload?.data?.value !== 1) throw new Error('vote gagal');

    const report = await request('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'comment',
        targetId: commentId,
        reason: 'Smoke test report comment'
      })
    });
    if (!report.response.ok || !report.payload?.data?.id) throw new Error('report gagal');
    const reportId = report.payload.data.id as string;

    const adminLogin = await request(
      '/api/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'change-me-admin' })
      },
      adminCookieJar
    );
    if (!adminLogin.response.ok) throw new Error('admin login gagal');

    const adminReports = await request('/api/admin/reports', {}, adminCookieJar);
    if (!adminReports.response.ok || !adminReports.payload?.data?.items?.length) throw new Error('admin reports gagal');

    const resolveReport = await request(
      `/api/admin/reports/${reportId}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ note: 'Resolved by smoke test' })
      },
      adminCookieJar
    );
    if (!resolveReport.response.ok) throw new Error('resolve report gagal');

    const deleteComment = await request(`/api/admin/comments/${commentId}`, { method: 'DELETE' }, adminCookieJar);
    if (!deleteComment.response.ok || !deleteComment.payload?.data?.deleted) throw new Error('delete comment gagal');

    const postDetail = await request(`/api/posts/${postId}`);
    if (!postDetail.response.ok || postDetail.payload?.data?.id !== postId) throw new Error('get post detail gagal');

    const adminStats = await request('/api/admin/stats', {}, adminCookieJar);
    if (!adminStats.response.ok || !adminStats.payload?.data?.stats?.posts) throw new Error('admin stats gagal');

    const statsAfter = await request('/api/site/stats');
    if (!statsAfter.response.ok || statsAfter.payload?.data?.stats?.comments < 1) {
      throw new Error('site stats akhir gagal');
    }

    console.log('\n[smoke:e2e] sukses: guest, post, comment, reaction, vote, report, admin, dan socket lolos.');
  } finally {
    if (serverProcess) {
      await stopChild(serverProcess);
    }
    await pg.stop().catch(() => undefined);
  }
}

void main().catch((error) => {
  console.error('\n[smoke:e2e] gagal', error);
  process.exit(1);
});
