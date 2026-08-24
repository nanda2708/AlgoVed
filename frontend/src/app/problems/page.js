'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import ProblemFilter from '../components/ProblemFilter';

export default function Problems() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    const controller = new AbortController();
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        const res = await axios.get(`${API_URL}/api/problems`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          timeout: 10000,
        });
        setProblems(Array.isArray(res.data) ? res.data : []);
        setError('');
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        setError(err.response?.data?.message || err.message || 'Failed to load problems');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProblems();
    return () => controller.abort();
  }, [isLoggedIn, authLoading, router, API_URL]);

  if (authLoading || loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-800" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900" />)}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto flex min-h-[55vh] w-full max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-xl border border-red-900/60 bg-slate-900 p-6 text-center">
          <h1 className="text-lg font-semibold text-white">Couldn’t load the problems</h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Try again</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-400">Practice</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">Problems</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Build your skills with focused algorithm and data-structure problems.</p>
      </div>

      {problems.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h2 className="font-semibold text-white">No problems available</h2>
          <p className="mt-2 text-sm text-slate-400">There aren’t any published problems yet.</p>
        </div>
      ) : (
        <ProblemFilter problems={problems} />
      )}
    </section>
  );
}
