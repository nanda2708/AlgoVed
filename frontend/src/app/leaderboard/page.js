'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const controller = new AbortController();
    axios.get(`${API_URL}/api/leaderboard`, { signal: controller.signal, timeout: 10000 })
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => { if (err.code !== 'ERR_CANCELED') setError(err.response?.data?.message || 'Failed to load leaderboard'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [API_URL]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7"><p className="text-sm font-medium text-blue-400">Community</p><h1 className="mt-1 text-3xl font-bold">Leaderboard</h1><p className="mt-2 text-sm text-slate-400">Rankings based on unique problems solved and accepted submissions.</p></div>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {loading ? <div className="p-8 text-sm text-slate-400">Loading leaderboard...</div> : error ? <div className="p-8 text-sm text-red-400">{error}</div> : rows.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No accepted submissions yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-800 bg-slate-950 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Problems solved</th><th className="px-5 py-3">Accepted</th></tr></thead><tbody>{rows.map((row) => <tr key={row.username} className="border-b border-slate-800 last:border-0"><td className="px-5 py-4 font-semibold text-slate-300">#{row.rank}</td><td className="px-5 py-4"><div className="font-medium text-white">{row.username}</div>{row.fullName && <div className="text-xs text-slate-500">{row.fullName}</div>}</td><td className="px-5 py-4 text-slate-300">{row.problemsSolved}</td><td className="px-5 py-4 text-slate-400">{row.acceptedSubmissions}</td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </main>
  );
}
