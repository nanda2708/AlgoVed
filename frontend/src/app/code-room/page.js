'use client';

import { useEffect, useMemo, useState, useContext, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.js';

const MonacoCodeEditor = dynamic(() => import('../components/MonacoCodeEditor.jsx'), { ssr: false });
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const DEFAULT_CODE = '// Start coding here';

function CodeRoom() {
  const { user, isLoggedIn, authLoading } = useContext(AuthContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('roomId');
  const socketRef = useRef(null);
  const [token, setToken] = useState(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('cpp');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputError, setOutputError] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const userLabel = useMemo(() => user?.username || 'You', [user]);

  useEffect(() => {
    setToken(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    if (!roomId) { setError('No room ID provided.'); setLoading(false); }
  }, [authLoading, isLoggedIn, roomId, router]);

  useEffect(() => {
    if (authLoading || !isLoggedIn || !roomId || !token) return undefined;
    let cancelled = false;
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    const fail = (message) => { if (!cancelled) { setError(typeof message === 'string' ? message : 'Room connection failed'); setLoading(false); } };
    socket.on('connect', () => socket.emit('joinRoom', { roomId, username: userLabel }));
    socket.on('roomJoined', (data) => {
      if (cancelled) return;
      setCode(data.code || DEFAULT_CODE);
      setLanguage(data.language === 'cpp' ? 'cpp' : 'cpp');
      setInput(data.input || '');
      setUsers(Array.isArray(data.users) ? data.users : []);
      setLoading(false);
      setError('');
    });
    socket.on('userJoined', (data) => {
      if (data?.userId) setUsers((prev) => prev.includes(data.userId) ? prev : [...prev, data.userId]);
    });
    socket.on('codeUpdate', (data) => {
      if (!data || data.roomId !== roomId) return;
      setCode(typeof data.code === 'string' ? data.code : DEFAULT_CODE);
      setLanguage('cpp');
    });
    socket.on('inputUpdate', (data) => {
      if (data?.roomId === roomId && typeof data.input === 'string') setInput(data.input);
    });
    socket.on('error', fail);
    socket.on('connect_error', () => fail('Unable to connect to the code room.'));
    socket.on('disconnect', (reason) => { if (reason === 'io server disconnect') fail('Your room connection was closed by the server.'); });

    return () => {
      cancelled = true;
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [authLoading, isLoggedIn, roomId, token, userLabel]);

  useEffect(() => {
    if (authLoading || !isLoggedIn || !roomId || !token) return undefined;
    const controller = new AbortController();
    axios.get(`${API_URL}/api/coding-room/${encodeURIComponent(roomId)}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, timeout: 10000,
    }).then(({ data }) => {
      if (socketRef.current?.connected) return;
      setCode(data.code || DEFAULT_CODE);
      setLanguage('cpp');
      setInput(data.input || '');
      setUsers(Array.isArray(data.users) ? data.users : []);
      setLoading(false);
    }).catch((err) => {
      if (err.code === 'ERR_CANCELED') return;
      setError(err.response?.data?.message || 'Failed to load room.');
      setLoading(false);
    });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, roomId, token]);

  const emitUpdate = (event, payload) => {
    const socket = socketRef.current;
    if (!socket?.connected) { setError('Room connection is unavailable.'); return false; }
    socket.emit(event, payload);
    return true;
  };

  const handleCodeChange = (nextCode) => {
    setCode(nextCode);
    emitUpdate('codeUpdate', { roomId, code: nextCode, language: 'cpp' });
  };

  const handleInputChange = (nextInput) => {
    setInput(nextInput);
    emitUpdate('inputUpdate', { roomId, input: nextInput });
  };

  const handleRun = async () => {
    setError(''); setOutput(''); setOutputError(''); setRunning(true);
    try {
      const res = await axios.post(`${API_URL}/api/compiler/run`, { language: 'cpp', code, input }, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 20000,
      });
      setOutput(res.data?.output || '');
      setOutputError(res.data?.error || '');
    } catch (err) {
      setOutputError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to run code');
    } finally { setRunning(false); }
  };

  if (authLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading code room…</main>;
  if (!isLoggedIn || !roomId) return null;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-lg font-semibold text-white">Code Room</h1><p className="text-xs text-slate-500">Room: {roomId}</p></div>
          <p className="text-sm text-slate-400">{users.length} {users.length === 1 ? 'member' : 'members'}</p>
        </div>
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-125px)] max-w-[1600px] gap-3 p-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)] sm:p-4">
        <section className="flex min-h-[55vh] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3"><span className="text-sm font-medium text-white">C++17</span><span className="text-xs text-slate-500">{userLabel}</span></div>
          <div className="min-h-0 flex-1"><MonacoCodeEditor code={code} setCode={handleCodeChange} language="cpp" height="100%" /></div>
          <div className="flex shrink-0 justify-end border-t border-slate-800 p-3"><button onClick={handleRun} disabled={running} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{running ? 'Running…' : 'Run code'}</button></div>
        </section>
        <aside className="flex min-h-[45vh] flex-col gap-3">
          <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-800 bg-slate-900 p-4"><label className="text-sm font-medium text-white">Input</label><textarea value={input} onChange={(e) => handleInputChange(e.target.value)} className="mt-2 min-h-40 flex-1 resize-y rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-200 outline-none focus:border-blue-500" placeholder="Enter custom input…" /></section>
          <section className="min-h-40 rounded-xl border border-slate-800 bg-slate-900 p-4"><h2 className="text-sm font-medium text-white">Output</h2><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 font-mono text-xs text-slate-300">{outputError || output || 'Run code to see output.'}</pre></section>
          {users.length > 0 && <section className="rounded-xl border border-slate-800 bg-slate-900 p-4"><h2 className="text-sm font-medium text-white">Members</h2><p className="mt-2 break-all text-xs leading-5 text-slate-400">{users.join(', ')}</p></section>}
        </aside>
      </div>
      {error && <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-red-900 bg-slate-900 px-4 py-3 text-sm text-red-300 shadow-lg" role="alert">{error}</div>}
    </main>
  );
}

export default function CodeRoomPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-950" />}><CodeRoom /></Suspense>;
}
