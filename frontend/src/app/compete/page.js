'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext.js';
import api, { errorMessage, isCancel } from '../../lib/api';
import { formatDateTime } from '../../lib/time';

const STATUS_STYLES = {
  ongoing: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  upcoming: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  ended: 'border-slate-700 bg-slate-800 text-slate-400',
};

export default function ContestsPage() {
  const { authLoading, isLoggedIn, isAdmin } = useContext(AuthContext);
  const router = useRouter();
  const [contests, setContests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isLoggedIn) { router.replace('/login'); return undefined; }
    const controller = new AbortController();
    api.get('/contests', { signal: controller.signal })
      .then(({ data }) => setContests(data))
      .catch((err) => { if (!isCancel(err)) setError(errorMessage(err, 'Failed to load contests')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, router]);

  if (authLoading || loading) return <main className="p-8 text-center text-slate-400">Loading contests…</main>;

  const order = { ongoing: 0, upcoming: 1, ended: 2 };
  const sorted = [...contests].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Contests</h1>
            <p className="mt-2 text-sm text-slate-400">Timed rounds with a live scoreboard. Easy, medium and hard problems are worth 10, 20 and 30 points.</p>
          </div>
          {isAdmin && <Link href="/admin/contests" className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">New contest</Link>}
        </div>
        {error && <p className="mt-6 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</p>}

        {sorted.length === 0 ? (
          <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No contests have been scheduled yet.</p>
        ) : (
          <ul className="mt-8 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
            {sorted.map((contest) => (
              <li key={contest._id}>
                <Link href={`/compete/${contest._id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-white">{contest.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(contest.startTime)} – {formatDateTime(contest.endTime)} · {contest.problemCount} problems · {contest.participantCount} registered
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${STATUS_STYLES[contest.status]}`}>{contest.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
