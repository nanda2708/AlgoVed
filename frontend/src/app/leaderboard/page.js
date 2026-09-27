'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api, { errorMessage, isCancel } from '../../lib/api';

export default function Leaderboard() {
  const { user } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/leaderboard', { signal: controller.signal })
      .then(({ data }) => setRows(data))
      .catch((err) => { if (!isCancel(err)) setError(errorMessage(err, 'Failed to load leaderboard')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="mt-2 text-sm text-slate-400">Top 100 by distinct problems solved. Ties go to whoever reached that count first.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        {loading ? <p className="p-6 text-sm text-slate-400">Loading…</p>
          : error ? <p className="p-6 text-sm text-red-400">{error}</p>
            : rows.length === 0 ? <p className="p-6 text-sm text-slate-400">No accepted submissions yet.</p> : (
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-900 text-xs text-slate-400">
                  <tr><th className="px-4 py-2.5">#</th><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5 text-right">Solved</th><th className="px-4 py-2.5 text-right">Accepted submissions</th></tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.username} className={`border-t border-slate-800 ${row.username === user?.username ? 'bg-blue-500/5' : ''}`}>
                      <td className="px-4 py-2.5 text-slate-400">{row.rank}</td>
                      <td className="px-4 py-2.5"><span className="font-medium">{row.username}</span>{row.fullName && <span className="ml-2 text-xs text-slate-500">{row.fullName}</span>}</td>
                      <td className="px-4 py-2.5 text-right">{row.problemsSolved}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{row.acceptedSubmissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </main>
  );
}
