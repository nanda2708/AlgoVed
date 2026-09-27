import { compileCpp, createWorkspace, execute, removeWorkspace } from './sandbox.js';

export const VERDICTS = Object.freeze({
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT: 'Time Limit Exceeded',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error',
});

export const DEFAULT_TIME_LIMIT_MS = 2000;
export const DEFAULT_MEMORY_LIMIT_MB = 256;

// Trailing spaces on a line and trailing blank lines are ignored, which is what
// most judges do; everything else must match exactly.
export const normalizeOutput = (value) => String(value ?? '')
  .replace(/\r\n?/g, '\n')
  .split('\n')
  .map((line) => line.trimEnd())
  .join('\n')
  .trimEnd();

const describeFailure = (run) => {
  if (run.status === 'time_limit') return 'Time limit exceeded';
  if (run.status === 'output_limit') return 'Output limit exceeded';
  const stderr = run.stderr.trim();
  const reason = run.signal ? `Program terminated by ${run.signal}` : `Program exited with code ${run.exitCode}`;
  return stderr ? `${reason}\n${stderr}` : reason;
};

const verdictFor = (run, expected) => {
  if (run.status === 'time_limit') return VERDICTS.TIME_LIMIT;
  if (run.status !== 'ok') return VERDICTS.RUNTIME_ERROR;
  return normalizeOutput(run.stdout) === normalizeOutput(expected) ? VERDICTS.ACCEPTED : VERDICTS.WRONG_ANSWER;
};

const withWorkspace = async (fn) => {
  const dir = await createWorkspace();
  try {
    return await fn(dir);
  } finally {
    await removeWorkspace(dir);
  }
};

const limitsFrom = ({ timeLimitMs, memoryLimitMb }) => ({
  timeLimitMs: Math.min(Math.max(Number(timeLimitMs) || DEFAULT_TIME_LIMIT_MS, 100), 10_000),
  memoryLimitMb: Math.min(Math.max(Number(memoryLimitMb) || DEFAULT_MEMORY_LIMIT_MB, 16), 1024),
});

/** Compiles and runs the program once against a single input. */
export const runOnce = ({ code, input = '', ...limits }) => withWorkspace(async (dir) => {
  const compiled = await compileCpp(dir, code);
  if (!compiled.ok) return { verdict: VERDICTS.COMPILATION_ERROR, output: '', error: compiled.message, timeMs: 0 };

  const run = await execute(compiled.binaryPath, input, limitsFrom(limits));
  const failed = run.status !== 'ok';
  return {
    verdict: failed ? verdictFor(run) : 'OK',
    output: run.stdout,
    error: failed ? describeFailure(run) : run.stderr,
    timeMs: run.timeMs,
  };
});

/**
 * Compiles once and runs every test case. By default judging stops at the first
 * failing test, like most online judges; pass stopOnFailure=false to run all.
 */
export const judge = ({ code, testCases, stopOnFailure = true, ...limits }) => withWorkspace(async (dir) => {
  const compiled = await compileCpp(dir, code);
  if (!compiled.ok) {
    return { verdict: VERDICTS.COMPILATION_ERROR, compileError: compiled.message, passed: 0, total: testCases.length, timeMs: 0, results: [] };
  }

  const resolvedLimits = limitsFrom(limits);
  const results = [];
  for (const testCase of testCases) {
    const run = await execute(compiled.binaryPath, testCase.input ?? '', resolvedLimits);
    const verdict = verdictFor(run, testCase.output);
    results.push({
      verdict,
      output: run.stdout,
      error: verdict === VERDICTS.RUNTIME_ERROR || verdict === VERDICTS.TIME_LIMIT ? describeFailure(run) : '',
      timeMs: Math.min(run.timeMs, resolvedLimits.timeLimitMs),
    });
    if (verdict !== VERDICTS.ACCEPTED && stopOnFailure) break;
  }

  const firstFailure = results.find((result) => result.verdict !== VERDICTS.ACCEPTED);
  return {
    verdict: firstFailure ? firstFailure.verdict : VERDICTS.ACCEPTED,
    passed: results.filter((result) => result.verdict === VERDICTS.ACCEPTED).length,
    total: testCases.length,
    timeMs: results.reduce((max, result) => Math.max(max, result.timeMs), 0),
    results,
  };
});
