'use client';

import { Suspense, useContext, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext.js';
import api, { API_URL, errorMessage, isCancel } from '../../lib/api';
import Verdict from '../components/Verdict';

const MonacoCodeEditor = dynamic(() => import('../components/MonacoCodeEditor.jsx'), { ssr: false });

function CodeRoom() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const roomId = useSearchParams().get('roomId');
  const router = useRouter();
  const socketRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [online, setOnline] = useState([]);
  const [connected, setConnected] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [invitee, setInvitee] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace('/login');
  }, [authLoading, isLoggedIn, router]);

  // Initial state over REST so the page renders even if the socket is slow to connect.
  useEffect(() => {
    if (authLoading || !isLoggedIn || !roomId) return undefined;
    const controller = new AbortController();
    api.get(`/coding-room/${encodeURIComponent(roomId)}`, { signal: controller.signal })
      .then(({ data }) => {
        setRoom(data);
        setCode(data.code);
        setInput(data.input);
      })
      .catch((err) => { if (!isCancel(err)) setError(errorMessage(err, 'Failed to load room')); });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, roomId]);

  useEffect(() => {
    if (authLoading || !isLoggedIn || !roomId) return undefined;
    const socket = io(API_URL, { auth: { token: localStorage.getItem('token') }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => { setConnected(true); socket.emit('joinRoom', { roomId }); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setError('Unable to connect to the room. Retrying…'));
    socket.on('roomJoined', (data) => {
      setRoom((current) => ({ ...current, members: data.members }));
      setCode(data.code);
      setInput(data.input);
      setError('');
    });
    socket.on('presence', (data) => { if (data.roomId === roomId) setOnline(data.online); });
    socket.on('codeUpdate', (data) => { if (data.roomId === roomId) setCode(data.code); });
    socket.on('inputUpdate', (data) => { if (data.roomId === roomId) setInput(data.input); });
    socket.on('error', (message) => setError(typeof message === 'string' ? message : 'Room error'));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authLoading, isLoggedIn, roomId]);

  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current?.emit('codeUpdate', { roomId, code: value });
  };

  const handleInputChange = (value) => {
    setInput(value);
    socketRef.current?.emit('inputUpdate', { roomId, input: value });
  };

  const handleRun = async () => {
    setRunning(true); setError('');
    try {
      const { data } = await api.post('/compiler/run', { language: 'cpp', code, input }, { timeout: 30000 });
      setRunResult(data);
    } catch (err) {
      setError(errorMessage(err, 'Failed to run code'));
    } finally {
      setRunning(false);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!invitee.trim()) return;
    setError(''); setNotice('');
    try {
      const { data } = await api.post('/coding-room/invite', { roomId, username: invitee.trim() });
      setRoom((current) => ({ ...current, members: [...(current?.members || []), data.member] }));
      setNotice(`${data.member.username} can now open this room.`);
      setInvitee('');
    } catch (err) {
      setError(errorMessage(err, 'Invite failed'));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice('Room link copied. Invite the person by username so they can open it.');
    } catch {
      setNotice(window.location.href);
    }
  };

  if (!roomId) return <main className="p-8 text-center text-slate-400">No room selected.</main>;
  if (authLoading || (!room && !error)) return <main className="flex min-h-[60vh] items-center justify-center text-slate-400">Loading room…</main>;
  if (!room) return <main className="flex min-h-[60vh] items-center justify-center px-4 text-center text-red-400">{error}</main>;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">{room.name}</h1>
            <p className="text-xs text-slate-500">{connected ? 'Live' : 'Reconnecting…'} · changes are saved automatically</p>
          </div>
          <button onClick={copyLink} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">Copy link</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-3 p-3 sm:p-4 lg:h-[calc(100vh-130px)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="min-h-0 flex-1"><MonacoCodeEditor code={code} setCode={handleCodeChange} language="cpp" height="100%" /></div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 p-3">
            <span className="text-xs text-slate-500">{runResult && (runResult.verdict === 'OK' ? `Finished in ${runResult.timeMs} ms` : <Verdict status={runResult.verdict} />)}</span>
            <button onClick={handleRun} disabled={running} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{running ? 'Running…' : 'Run'}</button>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <label htmlFor="room-input" className="text-sm font-medium text-white">Input (shared)</label>
            <textarea id="room-input" value={input} onChange={(e) => handleInputChange(e.target.value)} rows={6} className="mt-2 w-full resize-y rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500" />
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-medium text-white">Output</h2>
            <pre className="mt-2 max-h-56 min-h-[80px] overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 font-mono text-xs text-slate-300">
              {runResult ? [runResult.output, runResult.verdict !== 'OK' ? runResult.error : ''].filter(Boolean).join('\n') : ''}
            </pre>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-medium text-white">Members</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {(room.members || []).map((member) => (
                <li key={member.id} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${online.includes(member.id) ? 'bg-emerald-400' : 'bg-slate-600'}`} aria-hidden />
                  <span className="text-slate-300">{member.username}</span>
                  {online.includes(member.id) && <span className="text-xs text-slate-500">online</span>}
                </li>
              ))}
            </ul>
            <form onSubmit={handleInvite} className="mt-3 flex gap-2">
              <input value={invitee} onChange={(e) => setInvitee(e.target.value)} placeholder="Invite by username" className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500" />
              <button type="submit" className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">Add</button>
            </form>
            {notice && <p className="mt-2 break-all text-xs text-emerald-300">{notice}</p>}
          </section>
          {error && <p className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</p>}
        </aside>
      </div>
    </main>
  );
}

export default function CodeRoomPage() {
  return <Suspense fallback={null}><CodeRoom /></Suspense>;
}
