'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ContestsPage() {
  const { authLoading, isLoggedIn } = useContext(AuthContext);
  const router = useRouter();
  const [contests, setContests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace('/login');
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (authLoading || !isLoggedIn) return undefined;
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/contests`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, timeout: 10000 })
      .then(({ data }) => setContests(Array.isArray(data) ? data : []))
      .catch((err) => { if (err.code !== 'ERR_CANCELED') setError(err.response?.data?.message || 'Failed to load contests.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authLoading, isLoggedIn]);

  if (authLoading || loading) return <main className="flex min-h-[60vh] items-center justify-center bg-slate-950 text-slate-400">Loading contests…</main>;
  if (!isLoggedIn) return null;

  return <main className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><p className="text-sm font-medium text-blue-400">Competition</p><h1 className="mt-1 text-3xl font-bold">Contests</h1><p className="mt-2 text-sm text-slate-400">Join live contests and track your progress.</p>{error && <p className="mt-6 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</p>}<section className="mt-7 grid gap-4 md:grid-cols-2">{contests.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No contests are available yet.</div> : contests.map((contest) => <article key={contest._id} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold text-white">{contest.title}</h2><span className="shrink-0 rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{contest.status}</span></div><p className="mt-3 text-sm text-slate-400">{new Date(contest.startTime).toLocaleString()} — {new Date(contest.endTime).toLocaleString()}</p><p className="mt-2 text-xs text-slate-500">{contest.problems?.length || 0} problem{contest.problems?.length === 1 ? '' : 's'}</p><Link href={`/compete/${contest._id}`} className="mt-5 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">View contest</Link></article>)}</section></div></main>;
}
