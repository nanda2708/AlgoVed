'use client';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const [user, setUser] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    const controller = new AbortController();
    const fetchUser = async () => { try { const token = localStorage.getItem('token'); if (!token) throw new Error('Authentication required'); const res = await axios.get(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, timeout: 10000 }); setUser(res.data); } catch (err) { if (err.code !== 'ERR_CANCELED') setError(err.response?.data?.message || err.message || 'Failed to load profile'); } finally { if (!controller.signal.aborted) setLoading(false); } };
    fetchUser(); return () => controller.abort();
  }, [authLoading, isLoggedIn, router, API_URL]);
  if (authLoading || loading) return <main className="min-h-[70vh] bg-slate-950 p-8 text-center text-slate-400">Loading profile...</main>;
  if (error) return <main className="min-h-[70vh] bg-slate-950 p-8 text-center text-red-400" role="alert">{error}</main>;
  if (!user) return null;
  const stats = [['Current streak', user.currentStreak || 0], ['Best streak', user.maxStreak || 0], ['Problems solved', user.problemsSolved || 0], ['Submissions', user.submissions || 0]];
  return <main className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><section className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-blue-300">{user.username?.[0]?.toUpperCase() || 'U'}</div><div className="min-w-0"><h1 className="truncate text-2xl font-bold">{user.fullName || user.username}</h1><p className="text-sm text-slate-400">@{user.username}</p><p className="mt-1 break-all text-sm text-slate-500">{user.email}</p></div></div></section><section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="text-2xl font-bold text-white">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>)}</section><section className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-semibold">Achievements</h2>{user.achievements?.length ? <ul className="mt-3 space-y-2 text-sm text-slate-300">{user.achievements.map((item, index) => <li key={`${item}-${index}`} className="rounded-md bg-slate-950 px-3 py-2">{item}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No achievements yet.</p>}</section></div></main>;
}
