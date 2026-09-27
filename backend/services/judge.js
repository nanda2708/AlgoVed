import axios from 'axios';
import { VERDICTS } from '../models/verdicts.js';
import { truncate } from '../models/testCaseResult.js';

export const MAX_CODE_LENGTH = 100_000;
export const MAX_INPUT_LENGTH = 100_000;

export class JudgeUnavailableError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.status = status;
  }
}

const compilerRequest = async (path, payload, timeout) => {
  const baseUrl = process.env.COMPILER_API_URL?.replace(/\/$/, '');
  const key = process.env.COMPILER_API_KEY;
  if (!baseUrl || !key) throw new JudgeUnavailableError('Compiler service is not configured');

  try {
    const { data } = await axios.post(`${baseUrl}${path}`, payload, {
      headers: { 'x-compiler-key': key },
      timeout,
      maxContentLength: 10_000_000,
      maxBodyLength: 10_000_000,
    });
    return data;
  } catch (error) {
    if (error.response?.status === 400) {
      // Validation errors from the compiler are safe to show to the user.
      throw new JudgeUnavailableError(error.response.data?.error || 'Invalid request', 400);
    }
    if (error.code === 'ECONNABORTED') throw new JudgeUnavailableError('The judge took too long to respond', 504);
    if (error.response?.status === 503) throw new JudgeUnavailableError(error.response.data?.error || 'The judge is busy, please retry');
    console.error(`Compiler ${path} failed:`, error.message);
    throw new JudgeUnavailableError('The judge is currently unavailable', 502);
  }
};

const limitsOf = (problem) => ({ timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb });

export const runCode = ({ code, input, problem = {} }) => compilerRequest('/run', { language: 'cpp', code, input, ...limitsOf(problem) }, 30_000);

export const reviewCode = (code) => compilerRequest('/ai-review', { code }, 60_000);

/**
 * Judges code against the given test cases and returns a document-ready result:
 * { status, passed, total, timeMs, compileError, testCaseResults }.
 */
export const evaluate = async ({ code, problem, testCases = problem.testCases, stopOnFailure = true }) => {
  // Worst case every test runs to its limit, plus compilation.
  const timeout = 30_000 + testCases.length * ((problem.timeLimitMs || 2000) + 500);
  const result = await compilerRequest('/judge', {
    language: 'cpp',
    code,
    stopOnFailure,
    testCases: testCases.map(({ input, output }) => ({ input, output })),
    ...limitsOf(problem),
  }, timeout);

  const testCaseResults = (result.results || []).map((run, index) => {
    const testCase = testCases[index];
    return {
      status: run.verdict,
      hidden: Boolean(testCase.hidden),
      timeMs: run.timeMs,
      input: truncate(testCase.input),
      expected: truncate(testCase.output),
      actual: truncate(run.output),
      error: truncate(run.error),
    };
  });

  return {
    status: result.verdict,
    passed: result.passed ?? 0,
    total: result.total ?? testCases.length,
    timeMs: result.timeMs ?? 0,
    compileError: result.verdict === VERDICTS.COMPILATION_ERROR ? truncate(result.compileError) : undefined,
    testCaseResults,
  };
};

export const validateCode = (code, language = 'cpp') => {
  if (language !== 'cpp') return 'Only C++ is currently supported';
  if (typeof code !== 'string' || !code.trim()) return 'Code is required';
  if (code.length > MAX_CODE_LENGTH) return 'Code is too large';
  return null;
};
