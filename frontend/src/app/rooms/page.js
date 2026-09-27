'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext.js';
import api, { errorMessage, isCancel } from '../../lib/api';

export default function RoomsPage() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isLoggedIn) { router.replace('/login'); return undefined; }
    const controller = new AbortController();
    api.get('/coding-room/user/rooms', { signal: controller.signal })
      .then(({ data }) => setRooms(data))
      .catch((err) => { if (!isCancel(err)) setError(errorMessage(err, 'Failed to load rooms')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, router]);

  const createRoom = async (event) => {
    event.preventDefault();
    setCreating(true); setError('');
    try {
      const { data } = await api.post('/coding-room/create', { name: name.trim() });
      router.push(`/code-room?roomId=${encodeURIComponent(data.roomId)}`);
    } catch (err) {
      setError(errorMessage(err, 'Failed to create room'));
      setCreating(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-white">Coding rooms</h1>
        <p className="mt-2 text-sm text-slate-400">A shared C++ editor with a shared input box. Only members you add can open a room.</p>

        <form onSubmit={createRoom} className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Room name (optional)" className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button type="submit" disabled={creating} className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{creating ? 'Creating…' : 'New room'}</button>
        </form>
        {error && <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</p>}

        <section className="mt-8">
          {loading ? <p className="text-sm text-slate-400">Loading rooms…</p> : rooms.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">You are not in any rooms yet.</p>
          ) : (
            <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
              {rooms.map((room) => (
                <li key={room.roomId}>
                  <Link href={`/code-room?roomId=${encodeURIComponent(room.roomId)}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-slate-800/50">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{room.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{room.members.map((m) => m.username).join(', ')}</p>
                    </div>
                    {room.updatedAt && <span className="text-xs text-slate-500">Updated {new Date(room.updatedAt).toLocaleDateString()}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
