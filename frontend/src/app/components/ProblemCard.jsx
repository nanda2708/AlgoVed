import Link from 'next/link';

export default function ProblemCard({ problem }) {
  const tags = Array.isArray(problem?.tags) ? problem.tags : [];
  const difficulty = problem?.difficulty || 'Unknown';
  const difficultyClass = difficulty === 'Hard'
    ? 'border-red-500/30 bg-red-500/10 text-red-300'
    : difficulty === 'Medium'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      : difficulty === 'Easy'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        : 'border-slate-700 bg-slate-800 text-slate-300';

  return (
    <Link href={`/problems/${problem?._id || problem?.id}`} className="group block h-full rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-base font-semibold leading-6 text-slate-100 group-hover:text-blue-300">{problem?.title || 'Untitled problem'}</h2>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${difficultyClass}`}>{difficulty}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{problem?.description || 'Practice this problem and improve your problem-solving skills.'}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400">{tag}</span>
          ))}
          {tags.length > 4 && <span className="px-1 py-1 text-xs text-slate-500">+{tags.length - 4}</span>}
        </div>
      </div>
    </Link>
  );
}
