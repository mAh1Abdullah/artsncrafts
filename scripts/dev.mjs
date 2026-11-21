import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

process.stdout.on('error', () => {});
process.stderr.on('error', () => {});

const dashboardPort = process.env.PORT || '3000';
const host = process.env.HOST || '0.0.0.0';
const storefrontPort = process.env.STOREFRONT_PORT || '4321';

// 1. Ensure shared @waw/contracts dist exists before booting Next.js / Astro
const contractsDist = path.join(rootDir, 'packages', 'contracts', 'dist', 'index.js');
if (!fs.existsSync(contractsDist)) {
  const tscBin = fs.realpathSync(path.join(rootDir, 'node_modules', '.bin', 'tsc'));
  const buildResult = spawnSync(
    process.execPath,
    [tscBin, '-p', path.join(rootDir, 'packages', 'contracts', 'tsconfig.json')],
    { cwd: rootDir, stdio: 'inherit' }
  );
  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1);
  }
}

// 2. Remove stale Next.js 16 dev lock file if its recorded PID is no longer running
const nextDevLockPath = path.join(rootDir, 'apps', 'dashboard', '.next', 'dev', 'lock');
if (fs.existsSync(nextDevLockPath)) {
  let pidAlive = false;
  try {
    const raw = fs.readFileSync(nextDevLockPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed?.pid === 'number' && parsed.pid > 0) {
      process.kill(parsed.pid, 0);
      pidAlive = true;
    }
  } catch {
    pidAlive = false;
  }
  if (!pidAlive) {
    try {
      fs.unlinkSync(nextDevLockPath);
    } catch {
      // Ignore concurrent removal
    }
  }
}

const children = [];
let shuttingDown = false;

function killChildren(signal = 'SIGTERM') {
  for (const child of children) {
    if (!child || child.exitCode !== null) continue;
    try {
      child.kill(signal);
    } catch {
      // Child already exited
    }
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  killChildren('SIGTERM');
  setTimeout(() => {
    killChildren('SIGKILL');
    process.exit(exitCode);
  }, 1000).unref();
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
process.on('SIGHUP', () => shutdown(0));
process.on('exit', () => killChildren('SIGKILL'));

function launchWorkspace(name, binRelativePath, args, cwdRelativePath, port) {
  const cwd = path.join(rootDir, cwdRelativePath);
  const binPath = fs.realpathSync(path.join(cwd, binRelativePath));

  // Keep detached: false so all child servers share the supervisor's process group (PGID).
  // Container stops/restarts (SIGTERM/SIGKILL to -PGID) cleanly terminate both Next.js
  // and Astro together with zero orphaned processes or EPIPE deadlocks.
  const child = spawn(process.execPath, [binPath, ...args], {
    cwd,
    stdio: 'inherit',
    detached: false,
    env: {
      ...process.env,
      PORT: String(port),
    },
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`[dev] ${name} exited unexpectedly (code=${code}, signal=${signal})`);
      if (name === 'dashboard') {
        shutdown(code ?? 1);
      }
    }
  });

  children.push(child);
  return child;
}

function waitForPort(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    function attempt() {
      if (shuttingDown || Date.now() > deadline) {
        resolve(false);
        return;
      }
      const socket = net.createConnection({ host: '127.0.0.1', port: Number(port) });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => {
        socket.destroy();
        setTimeout(attempt, 200).unref();
      });
    }
    attempt();
  });
}

// 3. Boot Next.js Dashboard (:3000) first with full CPU priority for fastest startup
launchWorkspace(
  'dashboard',
  'node_modules/.bin/next',
  ['dev', '-p', String(dashboardPort), '-H', host],
  'apps/dashboard',
  dashboardPort
);

// 4. Start Astro Storefront (:4321) immediately once Dashboard (:3000) is accepting connections
waitForPort(dashboardPort).then(() => {
  if (shuttingDown) return;
  launchWorkspace(
    'storefront',
    'node_modules/.bin/astro',
    ['dev', '--port', String(storefrontPort), '--host', host],
    'apps/storefront',
    storefrontPort
  );
});
