'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext';
import api, { errorMessage } from '../../../lib/api';

const inputClass = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500';

// <input type="datetime-local"> works in local time without a zone suffix.
const toLocalInput = (date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function AdminContests() {
  const { isLoggedIn, authLoading, isAdmin } = useContext(AuthContext);
  const router = useRouter();
  const [problems, setProblems] = useState([]);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(() => toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    if (isAdmin) api.get('/problems').then(({ data }) => setProblems(data)).catch((err) => setError(errorMessage(err, 'Failed to load problems')));
  }, [authLoading, isLoggedIn, isAdmin, router]);

  const toggle = (id) => setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    const startTime = new Date(start);
    const endTime = new Date(startTime.getTime() + Number(durationMinutes) * 60_000);
    try {
      const { data } = await api.post('/contests', { title, startTime, endTime, problems: selected });
      router.push(`/compete/${data._id}`);
    } catch (err) {
      setError(errorMessage(err, 'Failed to create contest'));
      setSaving(false);
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return <main className="p-8 text-center text-slate-400">This page is only available to administrators.</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-slate-100 sm:px-6">
      <h1 className="text-2xl font-bold">Schedule a contest</h1>
      <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <label className="block"><span className="text-sm text-slate-400">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} required className={`mt-1 ${inputClass}`} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-sm text-slate-400">Starts at (your local time)</span><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className={`mt-1 ${inputClass}`} /></label>
          <label className="block"><span className="text-sm text-slate-400">Duration (minutes)</span><input type="number" min={5} max={10080} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required className={`mt-1 ${inputClass}`} /></label>
        </div>
        <fieldset>
          <legend className="text-sm text-slate-400">Problems, in contest order ({selected.length} selected)</legend>
          <ul className="mt-2 max-h-80 divide-y divide-slate-800 overflow-y-auto rounded-lg border border-slate-800">
            {problems.map((problem) => {
              const position = selected.indexOf(problem._id);
              return (
                <li key={problem._id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-800/50">
                    <input type="checkbox" checked={position !== -1} onChange={() => toggle(problem._id)} className="accent-blue-500" />
                    <span className="w-5 font-mono text-slate-500">{position !== -1 ? String.fromCharCode(65 + position) : ''}</span>
                    <span className="flex-1">{problem.title}</span>
                    <span className="text-xs text-slate-500">{problem.difficulty}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <button type="submit" disabled={saving || selected.length === 0} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{saving ? 'Creating…' : 'Create contest'}</button>
      </form>
    </main>
  );
}
