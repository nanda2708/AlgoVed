import { spawn, spawnSync } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const MAX_OUTPUT_BYTES = 1024 * 1024;
const COMPILE_TIMEOUT_MS = 15_000;
const WORK_ROOT = path.join(os.tmpdir(), 'algoved-jobs');

// prlimit ships with util-linux on Debian; when it is missing (macOS dev
// machines) programs still run, just without the per-process rlimits.
const HAS_PRLIMIT = process.platform === 'linux'
  && spawnSync('prlimit', ['--version'], { stdio: 'ignore' }).status === 0;

const childEnv = () => ({ PATH: process.env.PATH, LANG: 'C.UTF-8' });

export const createWorkspace = async () => {
  await fs.mkdir(WORK_ROOT, { recursive: true });
  return fs.mkdtemp(path.join(WORK_ROOT, 'job-'));
};

export const removeWorkspace = (dir) => fs.rm(dir, { recursive: true, force: true }).catch((error) => {
  console.warn(`Failed to remove ${dir}: ${error.message}`);
});

const collect = (stream, limit, onOverflow) => {
  const chunks = [];
  let size = 0;
  stream.on('data', (chunk) => {
    if (size >= limit) return;
    size += chunk.length;
    chunks.push(size > limit ? chunk.subarray(0, chunk.length - (size - limit)) : chunk);
    if (size >= limit) onOverflow();
  });
  return () => Buffer.concat(chunks).toString('utf8');
};

/**
 * Spawns a process, feeds it stdin and enforces a wall-clock limit.
 * Resolves with { stdout, stderr, exitCode, signal, timedOut, outputExceeded, timeMs }.
 */
const runProcess = (command, args, { cwd, input = '', timeoutMs, outputLimit = MAX_OUTPUT_BYTES }) => new Promise((resolve, reject) => {
  const startedAt = process.hrtime.bigint();
  const child = spawn(command, args, { cwd, env: childEnv(), stdio: ['pipe', 'pipe', 'pipe'] });
  let timedOut = false;
  let outputExceeded = false;

  const kill = () => { if (child.exitCode === null) child.kill('SIGKILL'); };
  const timer = setTimeout(() => { timedOut = true; kill(); }, timeoutMs);
  const stdout = collect(child.stdout, outputLimit, () => { outputExceeded = true; kill(); });
  const stderr = collect(child.stderr, 64 * 1024, () => {});

  child.on('error', (error) => { clearTimeout(timer); reject(error); });
  child.on('close', (exitCode, signal) => {
    clearTimeout(timer);
    resolve({
      stdout: stdout(),
      stderr: stderr(),
      exitCode,
      signal,
      timedOut,
      outputExceeded,
      timeMs: Number((process.hrtime.bigint() - startedAt) / 1_000_000n),
    });
  });

  // The program may exit without reading all of its input; that is not an error.
  child.stdin.on('error', () => {});
  child.stdin.end(input);
});

export const compileCpp = async (dir, source) => {
  const sourcePath = path.join(dir, 'main.cpp');
  const binaryPath = path.join(dir, 'main');
  await fs.writeFile(sourcePath, source);

  const result = await runProcess('g++', ['main.cpp', '-std=c++17', '-O2', '-pipe', '-o', 'main'], {
    cwd: dir,
    timeoutMs: COMPILE_TIMEOUT_MS,
  });

  if (result.timedOut) return { ok: false, message: 'Compilation timed out' };
  if (result.exitCode !== 0) {
    // Keep the diagnostics readable and avoid leaking the job directory path.
    return { ok: false, message: result.stderr.split(dir + path.sep).join('').trim() || 'Compilation failed' };
  }
  return { ok: true, binaryPath };
};

export const execute = async (binaryPath, input, { timeLimitMs, memoryLimitMb }) => {
  const limits = [
    `--as=${memoryLimitMb * 1024 * 1024}`,
    `--fsize=${MAX_OUTPUT_BYTES}`,
    '--core=0',
    '--nproc=256',
    // CPU seconds, rounded up; the wall-clock timer below is the real limit.
    `--cpu=${Math.ceil(timeLimitMs / 1000) + 1}`,
  ];
  const [command, args] = HAS_PRLIMIT ? ['prlimit', [...limits, '--', binaryPath]] : [binaryPath, []];

  const result = await runProcess(command, args, {
    cwd: path.dirname(binaryPath),
    input,
    // Small grace period so process start-up is not counted against tight limits.
    timeoutMs: timeLimitMs + 250,
  });

  let status = 'ok';
  if (result.timedOut || result.signal === 'SIGXCPU') status = 'time_limit';
  else if (result.outputExceeded) status = 'output_limit';
  else if (result.exitCode !== 0 || result.signal) status = 'runtime_error';

  return { ...result, status };
};
