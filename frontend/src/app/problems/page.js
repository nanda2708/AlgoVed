'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import api, { errorMessage, isCancel } from '../../lib/api';
import ProblemFilter from '../components/ProblemFilter';

export default function Problems() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    const controller = new AbortController();
    const fetchProblems = async () => {
      try {
        const res = await api.get('/problems', { signal: controller.signal });
        setProblems(res.data);
        setError('');
      } catch (err) {
        if (isCancel(err)) return;
        setError(errorMessage(err, 'Failed to load problems'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProblems();
    return () => controller.abort();
  }, [isLoggedIn, authLoading, router]);

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
        <h1 className="text-3xl font-bold tracking-tight text-white">Problems</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Solutions are compiled with g++ (C++17, -O2) and judged against hidden tests.</p>
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
