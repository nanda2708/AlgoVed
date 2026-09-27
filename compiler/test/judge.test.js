import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, normalizeOutput, runOnce, VERDICTS } from '../judge.js';

const SUM = '#include <iostream>\nint main(){ long long a,b; std::cin>>a>>b; std::cout<<a+b<<"\\n"; }';
const tests = [
  { input: '1 2\n', output: '3\n' },
  { input: '-5 5\n', output: '0' },
];

test('normalizeOutput ignores trailing whitespace and CRLF only', () => {
  assert.equal(normalizeOutput('1 2  \r\n3\n\n'), '1 2\n3');
  assert.notEqual(normalizeOutput('1  2'), normalizeOutput('1 2'));
});

test('accepts a correct solution and compiles once for all tests', async () => {
  const result = await judge({ code: SUM, testCases: tests });
  assert.equal(result.verdict, VERDICTS.ACCEPTED);
  assert.equal(result.passed, 2);
  assert.equal(result.results.length, 2);
});

test('reports wrong answer and stops at the first failing test', async () => {
  const code = '#include <iostream>\nint main(){ std::cout<<3; }';
  const result = await judge({ code, testCases: tests });
  assert.equal(result.verdict, VERDICTS.WRONG_ANSWER);
  assert.equal(result.passed, 1);
  assert.equal(result.results.length, 2);
});

test('reports compilation errors without the workspace path', async () => {
  const result = await judge({ code: 'int main( {', testCases: tests });
  assert.equal(result.verdict, VERDICTS.COMPILATION_ERROR);
  assert.ok(!result.compileError.includes('algoved-jobs'));
});

test('reports time limit exceeded', async () => {
  const code = 'int main(){ volatile unsigned long long x=0; while(true) x++; }';
  const result = await judge({ code, testCases: tests, timeLimitMs: 300 });
  assert.equal(result.verdict, VERDICTS.TIME_LIMIT);
});

test('reports runtime errors from non-zero exit codes', async () => {
  const result = await judge({ code: 'int main(){ return 3; }', testCases: tests });
  assert.equal(result.verdict, VERDICTS.RUNTIME_ERROR);
  assert.match(result.results[0].error, /code 3/);
});

test('writing to stderr does not fail an otherwise correct run', async () => {
  const code = '#include <iostream>\nint main(){ std::cerr<<"debug"; std::cout<<42; }';
  const result = await runOnce({ code });
  assert.equal(result.verdict, 'OK');
  assert.equal(result.output, '42');
});
