'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext.js';
import api, { errorMessage, isCancel } from '../../../lib/api';
import { formatDateTime, formatDuration } from '../../../lib/time';
import useCountdown from '../../components/useCountdown';

const SCOREBOARD_REFRESH_MS = 30_000;
const problemLabel = (index) => String.fromCharCode(65 + index);

function ScoreCell({ cell }) {
  if (!cell) return <td className="px-3 py-2 text-center text-slate-700">·</td>;
  if (cell.solved) {
    const wrong = cell.attempts - 1;
    return (
      <td className="px-3 py-2 text-center">
        <div className="font-medium text-emerald-400">+{wrong || ''}</div>
        <div className="text-[11px] text-slate-500">{cell.solvedAtMinutes}m</div>
      </td>
    );
  }
  return <td className="px-3 py-2 text-center font-medium text-red-400">−{cell.attempts}</td>;
}

export default function ContestPage() {
  const { id } = useParams();
  const { authLoading, isLoggedIn, user } = useContext(AuthContext);
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [board, setBoard] = useState({ problems: [], rows: [] });
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const reloadedAtStart = useRef(false);

  const status = contest?.status;
  const untilStart = useCountdown(contest?.startTime);
  const untilEnd = useCountdown(contest?.endTime);

  const load = useCallback(async (signal) => {
    const [contestRes, boardRes] = await Promise.all([
      api.get(`/contests/${id}`, { signal }),
      api.get(`/contests/${id}/leaderboard`, { signal }),
    ]);
    setContest(contestRes.data);
    setBoard(boardRes.data);
  }, [id]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isLoggedIn) { router.replace('/login'); return undefined; }
    const controller = new AbortController();
    const refresh = () => load(controller.signal).catch((err) => { if (!isCancel(err)) setError(errorMessage(err, 'Failed to load contest')); });
    refresh();
    const timer = setInterval(refresh, SCOREBOARD_REFRESH_MS);
    return () => { controller.abort(); clearInterval(timer); };
  }, [authLoading, isLoggedIn, load, router]);

  // Reload when the contest starts so the problem list appears without a manual refresh.
  useEffect(() => {
    if (status === 'upcoming' && untilStart <= 0 && !reloadedAtStart.current) {
      reloadedAtStart.current = true;
      // Small delay so the server clock has also passed the start time.
      setTimeout(() => load().catch(() => {}), 2000);
    }
  }, [status, untilStart, load]);

  const join = async () => {
    setJoining(true); setError('');
    try {
      await api.post(`/contests/${id}/join`);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Unable to register'));
    } finally {
      setJoining(false);
    }
  };

  if (!contest) return <main className="p-8 text-center text-slate-400">{error || 'Loading contest…'}</main>;

  const canSolve = contest.hasJoined && status === 'ongoing';

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{contest.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{formatDateTime(contest.startTime)} – {formatDateTime(contest.endTime)} · {contest.participantCount} registered</p>
          </div>
          <div className="text-right">
            {status === 'upcoming' && <p className="font-mono text-lg">Starts in {formatDuration(untilStart)}</p>}
            {status === 'ongoing' && <p className="font-mono text-lg">{formatDuration(untilEnd)} left</p>}
            {status === 'ended' && <p className="text-sm text-slate-400">Contest over</p>}
            {status !== 'ended' && !contest.hasJoined && (
              <button onClick={join} disabled={joining} className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{joining ? 'Registering…' : 'Register'}</button>
            )}
            {contest.hasJoined && status !== 'ended' && <p className="mt-1 text-xs text-emerald-400">You are registered</p>}
          </div>
        </div>
        {error && <p className="mt-5 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</p>}

        <section className="mt-8">
          <h2 className="font-semibold">Problems</h2>
          {status === 'upcoming' && contest.problems.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">{contest.problemCount} problems will be revealed when the contest starts.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
              {contest.problems.map((problem, index) => (
                <li key={problem._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span><span className="mr-3 font-mono text-slate-500">{problemLabel(index)}</span>{problem.title} <span className="ml-2 text-xs text-slate-500">{problem.difficulty}</span></span>
                  {canSolve ? <Link href={`/compete/${id}/${problem._id}`} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">Solve</Link>
                    : status === 'ended' ? <Link href={`/problems/${problem._id}`} className="text-sm text-blue-400 hover:underline">Practice</Link> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Scoreboard</h2>
            <p className="text-xs text-slate-500">Ties broken by penalty: minutes to solve + 10 per rejected attempt</p>
          </div>
          {board.rows.length === 0 ? <p className="mt-3 text-sm text-slate-400">No submissions yet.</p> : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-900 text-xs text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    <th className="px-3 py-2 text-right">Penalty</th>
                    {board.problems.map((problem, index) => <th key={problem._id} className="px-3 py-2 text-center" title={`${problem.title} (${problem.points} pts)`}>{problemLabel(index)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {board.rows.map((row) => (
                    <tr key={row.userId} className={`border-t border-slate-800 ${row.username === user?.username ? 'bg-blue-500/5' : ''}`}>
                      <td className="px-3 py-2 text-slate-400">{row.rank}</td>
                      <td className="px-3 py-2 font-medium">{row.username}</td>
                      <td className="px-3 py-2 text-right">{row.score}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{row.penalty}</td>
                      {board.problems.map((problem) => <ScoreCell key={problem._id} cell={row.problems[problem._id]} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
