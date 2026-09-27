'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthContext } from './context/AuthContext';
import api from '../lib/api';

const VERDICTS = [
  ['Accepted', 'text-emerald-400', 'Output matched on every test.'],
  ['Wrong Answer', 'text-red-400', 'Output differs from the expected answer. For visible tests you see both side by side.'],
  ['Time Limit Exceeded', 'text-amber-400', 'Each problem sets its own limit; the process is killed when it runs out.'],
  ['Runtime Error', 'text-orange-400', 'Non-zero exit, a crash signal, or going over the memory limit.'],
  ['Compilation Error', 'text-yellow-300', 'The g++ diagnostics are returned as-is.'],
];

export default function Home() {
  const { isLoggedIn } = useContext(AuthContext);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/leaderboard/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <section className="py-16 sm:py-24">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">Practice competitive programming in C++.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
          AlgoVed is an online judge. Solve problems, get a verdict against hidden tests in a few seconds,
          compete in timed contests, and pair up with a friend in a shared editor.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={isLoggedIn ? '/problems' : '/signup'} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
            {isLoggedIn ? 'Go to problems' : 'Create an account'}
          </Link>
          <Link href="/leaderboard" className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800">View leaderboard</Link>
        </div>
        {stats && (
          <p className="mt-8 text-sm text-slate-500">
            {stats.problems} problems · {stats.users} users · {stats.submissions} submissions judged
          </p>
        )}
      </section>

      <section className="grid gap-10 border-t border-slate-800 py-14 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-white">How judging works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-400">
            <li>Your code is compiled once with <code className="text-slate-300">g++ -std=c++17 -O2</code>.</li>
            <li>The binary runs against each test with the problem&apos;s time and memory limits enforced by the kernel (rlimits).</li>
            <li>Output is compared line by line, ignoring trailing whitespace.</li>
            <li>Judging stops at the first failing test, and the verdict is recorded on your profile.</li>
          </ol>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Verdicts</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {VERDICTS.map(([name, color, text]) => (
              <div key={name}>
                <dt className={`font-medium ${color}`}>{name}</dt>
                <dd className="text-slate-400">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-6 border-t border-slate-800 py-14 sm:grid-cols-3">
        <Link href="/compete" className="group">
          <h3 className="font-semibold text-white group-hover:text-blue-300">Contests</h3>
          <p className="mt-1 text-sm text-slate-400">ICPC-style scoreboard with penalty time, refreshed live.</p>
        </Link>
        <Link href="/rooms" className="group">
          <h3 className="font-semibold text-white group-hover:text-blue-300">Coding rooms</h3>
          <p className="mt-1 text-sm text-slate-400">A private shared editor over WebSockets, with presence.</p>
        </Link>
        <Link href="/compiler" className="group">
          <h3 className="font-semibold text-white group-hover:text-blue-300">Playground</h3>
          <p className="mt-1 text-sm text-slate-400">Run any C++ snippet with custom input, plus optional AI feedback.</p>
        </Link>
      </section>
    </div>
  );
}
