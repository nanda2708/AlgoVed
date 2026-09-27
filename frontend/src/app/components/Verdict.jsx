const STYLES = {
  Accepted: 'text-emerald-400',
  'Wrong Answer': 'text-red-400',
  'Time Limit Exceeded': 'text-amber-400',
  'Runtime Error': 'text-orange-400',
  'Compilation Error': 'text-yellow-300',
};

export const verdictClass = (verdict) => STYLES[verdict] || 'text-slate-400';

export default function Verdict({ status, className = '' }) {
  return <span className={`font-medium ${verdictClass(status)} ${className}`}>{status}</span>;
}

// Plain-language summary for a judged submission, e.g. "Wrong Answer on test 3".
export function describeResult(result) {
  if (!result?.status) return '';
  if (result.status === 'Accepted') return `Accepted · ${result.passed}/${result.total} tests · ${result.timeMs} ms`;
  if (result.status === 'Compilation Error') return 'Compilation Error';
  const failedAt = (result.testCaseResults?.length || 0);
  return failedAt ? `${result.status} on test ${failedAt}` : result.status;
}
