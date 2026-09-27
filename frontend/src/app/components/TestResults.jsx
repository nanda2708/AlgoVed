import Verdict from './Verdict';

const Block = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs text-slate-500">{label}</p>
    <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-900 p-2 font-mono text-xs text-slate-200">{value || '(empty)'}</pre>
  </div>
);

export default function TestResults({ result }) {
  if (!result) return null;

  if (result.status === 'Compilation Error') {
    return <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-yellow-900/60 bg-slate-950 p-3 font-mono text-xs text-yellow-200">{result.compileError || 'Compilation failed'}</pre>;
  }

  return (
    <ol className="space-y-2">
      {(result.testCaseResults || []).map((test, index) => (
        <li key={index} className="rounded-md border border-slate-800 bg-slate-950 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-300">Test {index + 1}{test.hidden ? ' (hidden)' : ''}</span>
            <span className="flex items-center gap-3 text-xs">
              {typeof test.timeMs === 'number' && <span className="text-slate-500">{test.timeMs} ms</span>}
              <Verdict status={test.status} />
            </span>
          </div>
          {!test.hidden && test.status !== 'Accepted' && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Block label="Input" value={test.input} />
              <Block label="Expected" value={test.expected} />
              <Block label={test.error ? 'Error' : 'Your output'} value={test.error || test.actual} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
