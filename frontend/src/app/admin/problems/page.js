'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext';
import api, { errorMessage } from '../../../lib/api';

const emptyTest = () => ({ input: '', output: '', hidden: true });
const emptyForm = () => ({
  title: '',
  description: '',
  difficulty: 'Easy',
  tags: '',
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  testCases: [{ input: '', output: '', hidden: false }, emptyTest()],
});

const inputClass = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500';

export default function AdminProblems() {
  const { isLoggedIn, authLoading, isAdmin } = useContext(AuthContext);
  const router = useRouter();
  const [problems, setProblems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    if (!isAdmin) return;
    api.get('/problems').then(({ data }) => setProblems(data)).catch((err) => setError(errorMessage(err, 'Failed to load problems')));
  }, [authLoading, isLoggedIn, isAdmin, router]);

  const visible = useMemo(() => problems.filter((p) => p.title.toLowerCase().includes(search.trim().toLowerCase())), [problems, search]);

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const setTest = (index, name, value) => setForm((current) => ({
    ...current,
    testCases: current.testCases.map((tc, i) => (i === index ? { ...tc, [name]: value } : tc)),
  }));

  const reset = () => { setForm(emptyForm()); setEditingId(null); };

  const startEdit = async (id) => {
    setError(''); setMessage('');
    try {
      const { data } = await api.get(`/problems/${id}`);
      setForm({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: (data.tags || []).join(', '),
        timeLimitMs: data.timeLimitMs || 2000,
        memoryLimitMb: data.memoryLimitMb || 256,
        testCases: data.testCases.map(({ input, output, hidden }) => ({ input, output, hidden: Boolean(hidden) })),
      });
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err, 'Failed to load problem'));
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    const payload = {
      ...form,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      timeLimitMs: Number(form.timeLimitMs),
      memoryLimitMb: Number(form.memoryLimitMb),
    };
    try {
      if (editingId) {
        const { data } = await api.put(`/problems/${editingId}`, payload);
        setProblems((items) => items.map((p) => (p._id === editingId ? data.problem : p)));
        setMessage('Problem updated.');
      } else {
        const { data } = await api.post('/problems', payload);
        setProblems((items) => [data.problem, ...items]);
        setMessage('Problem created.');
      }
      reset();
    } catch (err) {
      setError(errorMessage(err, 'Failed to save problem'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (problem) => {
    if (!window.confirm(`Delete "${problem.title}"? Existing submissions will keep pointing at a deleted problem.`)) return;
    try {
      await api.delete(`/problems/${problem._id}`);
      setProblems((items) => items.filter((p) => p._id !== problem._id));
      if (editingId === problem._id) reset();
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete problem'));
    }
  };

  if (authLoading) return null;
  if (!isAdmin) return <main className="p-8 text-center text-slate-400">This page is only available to administrators.</main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{editingId ? 'Edit problem' : 'New problem'}</h1>
        <Link href="/admin/contests" className="text-sm text-blue-400 hover:underline">Schedule a contest →</Link>
      </div>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <label className="block"><span className="text-sm text-slate-400">Title</span><input value={form.title} onChange={(e) => setField('title', e.target.value)} required className={`mt-1 ${inputClass}`} /></label>
          <label className="block"><span className="text-sm text-slate-400">Difficulty</span>
            <select value={form.difficulty} onChange={(e) => setField('difficulty', e.target.value)} className={`mt-1 ${inputClass}`}>
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-slate-400">Statement (Markdown)</span>
          <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={10} required className={`mt-1 font-mono ${inputClass}`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block"><span className="text-sm text-slate-400">Tags (comma separated)</span><input value={form.tags} onChange={(e) => setField('tags', e.target.value)} className={`mt-1 ${inputClass}`} /></label>
          <label className="block"><span className="text-sm text-slate-400">Time limit (ms)</span><input type="number" min={100} max={10000} step={100} value={form.timeLimitMs} onChange={(e) => setField('timeLimitMs', e.target.value)} className={`mt-1 ${inputClass}`} /></label>
          <label className="block"><span className="text-sm text-slate-400">Memory limit (MB)</span><input type="number" min={16} max={1024} value={form.memoryLimitMb} onChange={(e) => setField('memoryLimitMb', e.target.value)} className={`mt-1 ${inputClass}`} /></label>
        </div>

        <fieldset>
          <legend className="text-sm text-slate-400">Tests <span className="text-slate-500">— visible tests are shown as examples; hidden tests are only used for judging</span></legend>
          <div className="mt-2 space-y-3">
            {form.testCases.map((tc, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Test {i + 1}</span>
                  <span className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={tc.hidden} onChange={(e) => setTest(i, 'hidden', e.target.checked)} className="accent-blue-500" />Hidden</label>
                    <button type="button" disabled={form.testCases.length === 1} onClick={() => setField('testCases', form.testCases.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 disabled:opacity-40">Remove</button>
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea value={tc.input} onChange={(e) => setTest(i, 'input', e.target.value)} rows={3} placeholder="Input" required className={`font-mono text-xs ${inputClass}`} />
                  <textarea value={tc.output} onChange={(e) => setTest(i, 'output', e.target.value)} rows={3} placeholder="Expected output" required className={`font-mono text-xs ${inputClass}`} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setField('testCases', [...form.testCases, emptyTest()])} className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">Add test</button>
        </fieldset>

        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create problem'}</button>
          {editingId && <button type="button" onClick={reset} className="rounded-md px-4 py-2 text-sm text-slate-400 hover:bg-slate-800">Cancel</button>}
        </div>
      </form>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">All problems ({problems.length})</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by title" className={`max-w-xs ${inputClass}`} />
        </div>
        <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
          {visible.map((problem) => (
            <li key={problem._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link href={`/problems/${problem._id}`} className="font-medium hover:text-blue-300">{problem.title}</Link>
                <p className="text-xs text-slate-500">{problem.difficulty}{problem.tags?.length ? ` · ${problem.tags.join(', ')}` : ''} · <span className="font-mono">{problem._id}</span></p>
              </div>
              <div className="flex gap-2 text-sm">
                <button onClick={() => startEdit(problem._id)} className="rounded-md px-3 py-1.5 hover:bg-slate-800">Edit</button>
                <button onClick={() => remove(problem)} className="rounded-md px-3 py-1.5 text-red-400 hover:bg-slate-800">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
