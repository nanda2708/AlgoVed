'use client';
import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.js';

export default function RoomsPage() {
  const { user, isLoggedIn, authLoading } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]); const [inviteUsername, setInviteUsername] = useState(''); const [inviteRoomId, setInviteRoomId] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [creating, setCreating] = useState(false); const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const token = () => localStorage.getItem('token');
  const config = useCallback(() => ({ headers: { Authorization: `Bearer ${token()}` }, timeout: 10000 }), []);

  useEffect(() => { if (!authLoading && !isLoggedIn) router.replace('/login'); }, [authLoading, isLoggedIn, router]);
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false; setLoading(true);
    axios.get(`${API_URL}/api/coding-room/user/rooms`, config()).then((res) => { if (!cancelled) setRooms(Array.isArray(res.data) ? res.data : []); }).catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Failed to fetch rooms'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLoggedIn, API_URL, config]);

  const handleCreateRoom = async () => { setError(''); setCreating(true); try { const res = await axios.post(`${API_URL}/api/coding-room/create`, {}, config()); const { roomId } = res.data; router.push(`/code-room?roomId=${encodeURIComponent(roomId)}`); } catch (err) { setError(err.response?.data?.message || 'Failed to create room'); } finally { setCreating(false); } };
  const handleInviteUser = async () => { if (!inviteRoomId.trim() || !inviteUsername.trim()) return setError('Room ID and username are required'); setError(''); try { await axios.post(`${API_URL}/api/coding-room/invite`, { roomId: inviteRoomId.trim(), username: inviteUsername.trim() }, config()); setInviteRoomId(''); setInviteUsername(''); const res = await axios.get(`${API_URL}/api/coding-room/user/rooms`, config()); setRooms(Array.isArray(res.data) ? res.data : []); } catch (err) { setError(err.response?.data?.message || 'Invite failed'); } };

  if (authLoading || (!isLoggedIn && typeof window !== 'undefined')) return <div className="min-h-[60vh] bg-slate-950 p-8 text-slate-400">Loading...</div>;
  return <main className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-blue-400">Collaboration</p><h1 className="mt-1 text-3xl font-bold">Coding rooms</h1><p className="mt-2 text-sm text-slate-400">Work on C++ code together in a private room.</p></div><button disabled={creating} onClick={handleCreateRoom} className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{creating ? 'Creating…' : 'Create room'}</button></div>{error && <div className="mt-6 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</div>}<section className="mt-7 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5"><h2 className="font-semibold">Invite a user</h2><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input value={inviteRoomId} onChange={(e) => setInviteRoomId(e.target.value)} placeholder="Room ID" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /><input value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="Username" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" /><button onClick={handleInviteUser} className="rounded-md border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800">Invite</button></div></section><section className="mt-7"><h2 className="mb-3 font-semibold">Your rooms</h2>{loading ? <p className="text-sm text-slate-400">Loading rooms...</p> : rooms.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No rooms yet. Create one to start collaborating.</div> : <div className="grid gap-3 sm:grid-cols-2">{rooms.map((room) => <article key={room.roomId} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="break-all text-sm text-slate-300"><span className="text-slate-500">Room:</span> {room.roomId}</div><div className="mt-2 text-xs text-slate-500">{room.users?.length || 0} member{room.users?.length === 1 ? '' : 's'}</div><button onClick={() => router.push(`/code-room?roomId=${encodeURIComponent(room.roomId)}`)} className="mt-4 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700">Open room</button></article>)}</div>}</section></div></main>;
}
