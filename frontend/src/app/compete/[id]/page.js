'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ContestPage() {
  const { id } = useParams();
  const { authLoading, isLoggedIn } = useContext(AuthContext);
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, timeout: 10000 });
  const load = useCallback(async (signal) => {
    const [contestRes, leaderboardRes] = await Promise.all([
      axios.get(`${API_URL}/api/contests/${encodeURIComponent(id)}`, { ...config(), signal }),
      axios.get(`${API_URL}/api/contests/${encodeURIComponent(id)}/leaderboard`, { ...config(), signal }),
    ]);
    setContest(contestRes.data);
    setLeaderboard(Array.isArray(leaderboardRes.data) ? leaderboardRes.data : []);
  }, [id]);

  useEffect(() => { if (!authLoading && !isLoggedIn) router.replace('/login'); }, [authLoading, isLoggedIn, router]);
  useEffect(() => {
    if (authLoading || !isLoggedIn || !id) return undefined;
    const controller = new AbortController();
    load(controller.signal).catch((err) => { if (err.code !== 'ERR_CANCELED') setError(err.response?.data?.message || 'Failed to load contest.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, id, load]);

  const join = async () => {
    setJoining(true); setError('');
    try { await axios.post(`${API_URL}/api/contests/${encodeURIComponent(id)}/join`, {}, config()); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Unable to join contest.'); }
    finally { setJoining(false); }
  };

  if (authLoading || loading) return <main className="flex min-h-[60vh] items-center justify-center bg-slate-950 text-slate-400">Loading contest…</main>;
  if (!isLoggedIn) return null;
  if (!contest) return <main className="flex min-h-[60vh] items-center justify-center bg-slate-950 px-4 text-center text-red-400">{error || 'Contest not found.'}</main>;

  return <main className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-blue-400">{contest.status}</p><h1 className="mt-1 text-3xl font-bold">{contest.title}</h1><p className="mt-2 text-sm text-slate-400">Ends {new Date(contest.endTime).toLocaleString()}</p></div>{contest.status === 'ongoing' && !contest.hasJoined && <button onClick={join} disabled={joining} className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{joining ? 'Joining…' : 'Join contest'}</button>}</div>{error && <p className="mt-5 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</p>}<section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-semibold text-white">Problems</h2><div className="mt-4 space-y-2">{contest.problems?.length ? contest.problems.map((problem) => <div key={problem._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4"><div><p className="font-medium text-slate-100">{problem.title}</p><p className="mt-1 text-xs text-slate-500">{problem.difficulty} · C++17</p></div>{contest.hasJoined && contest.status === 'ongoing' ? <Link href={`/compete/${id}/${problem._id}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Solve</Link> : <span className="text-xs text-slate-500">Join while active to solve</span>}</div>) : <p className="text-sm text-slate-400">No problems configured.</p>}</div></section><section className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900"><div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold text-white">Leaderboard</h2></div>{leaderboard.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-950 text-slate-400"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Solved</th><th className="px-5 py-3">Score</th></tr></thead><tbody>{leaderboard.map((entry) => <tr key={entry.userId} className="border-t border-slate-800"><td className="px-5 py-3">{entry.rank}</td><td className="px-5 py-3">{entry.username}</td><td className="px-5 py-3">{entry.solved}</td><td className="px-5 py-3">{entry.score}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-slate-400">No accepted submissions yet.</p>}</section></div></main>;
}
