'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import api, { errorMessage, isCancel } from '../../lib/api';
import Verdict from '../components/Verdict';

const DIFFICULTY_COLORS = { Easy: 'bg-emerald-400', Medium: 'bg-amber-400', Hard: 'bg-red-400' };

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function Profile() {
  const { user, isLoggedIn, authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isLoggedIn) { router.replace('/login'); return undefined; }
    const controller = new AbortController();
    api.get('/users/me/stats', { signal: controller.signal })
      .then(({ data }) => setStats(data))
      .catch((err) => { if (!isCancel(err)) setError(errorMessage(err, 'Failed to load profile')); });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, router]);

  if (error) return <main className="p-8 text-center text-red-400" role="alert">{error}</main>;
  if (authLoading || !user || !stats) return <main className="p-8 text-center text-slate-400">Loading profile…</main>;

  const maxSolved = Math.max(1, ...Object.values(stats.solvedByDifficulty));

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xl font-semibold text-blue-300">{user.username[0].toUpperCase()}</div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{user.fullName || user.username}</h1>
            <p className="text-sm text-slate-400">@{user.username}{user.createdAt && ` · joined ${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}</p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Problems solved" value={stats.solved} />
          <Stat label="Submissions" value={stats.totalSubmissions} />
          <Stat label="Acceptance rate" value={`${stats.acceptanceRate}%`} />
          <Stat label={`Day streak (best ${stats.streak.best})`} value={stats.streak.current} />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Solved by difficulty</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(stats.solvedByDifficulty).map(([difficulty, count]) => (
                <div key={difficulty}>
                  <div className="flex justify-between text-sm"><span className="text-slate-300">{difficulty}</span><span className="text-slate-400">{count}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-800"><div className={`h-1.5 rounded-full ${DIFFICULTY_COLORS[difficulty]}`} style={{ width: `${(count / maxSolved) * 100}%` }} /></div>
                </div>
              ))}
            </div>
            {Object.keys(stats.verdicts).length > 0 && (
              <>
                <h2 className="mt-6 font-semibold">Verdicts</h2>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {Object.entries(stats.verdicts).sort((a, b) => b[1] - a[1]).map(([verdict, count]) => (
                    <li key={verdict} className="flex justify-between"><Verdict status={verdict} /><span className="text-slate-400">{count}</span></li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Recent submissions</h2>
            {stats.recentSubmissions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Nothing yet. <Link href="/problems" className="text-blue-400 hover:underline">Pick a problem</Link> to get started.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-800 text-sm">
                {stats.recentSubmissions.map((s) => (
                  <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    {s.problemId ? <Link href={`/problems/${s.problemId}`} className="text-slate-200 hover:text-blue-300">{s.problemTitle}</Link> : <span className="text-slate-500">{s.problemTitle}</span>}
                    <span className="flex items-center gap-3 text-xs">
                      <Verdict status={s.status} />
                      <span className="text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
