'use client';

import { useEffect, useState, useContext, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { AuthContext } from '../../../context/AuthContext.js';

const MonacoCodeEditor = dynamic(() => import('../../../components/MonacoCodeEditor.jsx'), { ssr: false });
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const DEFAULT_CODE = '#include <iostream>\nusing namespace std;\n\nint main() {\n    int num1, num2;\n    cin >> num1 >> num2;\n    cout << num1 + num2;\n    return 0;\n}';

function ContestProblem() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const { id, problemId } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [verdict, setVerdict] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    if (!id || !problemId) { setError('Invalid contest or problem.'); setLoading(false); return; }
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    const config = { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, timeout: 10000 };
    Promise.all([
      axios.get(`${API_URL}/api/contests/${encodeURIComponent(id)}`, config),
      axios.get(`${API_URL}/api/problems/${encodeURIComponent(problemId)}`, config),
      axios.get(`${API_URL}/api/contest-submissions`, { ...config, params: { contestId: id, problemId } }),
    ]).then(([contestRes, problemRes, submissionsRes]) => {
      setContest(contestRes.data);
      setProblem(problemRes.data);
      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
    }).catch((err) => {
      if (err.code === 'ERR_CANCELED') return;
      setError(err.response?.data?.message || 'Failed to load contest problem.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, id, problemId, router]);

  useEffect(() => {
    if (!contest?.endTime) return undefined;
    const tick = () => {
      const diff = new Date(contest.endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeRemaining('Contest ended'); return; }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  const run = async () => {
    setError(''); setOutput(''); setVerdict(''); setRunning(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/compiler/run`, { language: 'cpp', code, input }, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });
      setOutput(res.data?.output || ''); setVerdict('Executed with custom input');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run code.');
      setVerdict('Execution failed');
    } finally { setRunning(false); }
  };

  const submit = async () => {
    setError(''); setVerdict(''); setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/contest-submissions`, { contestId: id, problemId, code, language: 'cpp' }, { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 });
      setSubmissions((prev) => [res.data, ...prev]);
      setVerdict(res.data?.status || 'Submitted');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
      setVerdict('Submission failed');
    } finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading contest…</main>;
  if (error && !problem) return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-red-400">{error}</main>;
  if (!problem || !contest) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Contest problem not found.</main>;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3"><div><h1 className="text-lg font-semibold text-white">{contest.title}</h1><p className="text-xs text-slate-500">{problem.title}</p></div><div className="text-sm font-medium text-slate-300">{timeRemaining}</div></div></header>
      <div className="mx-auto grid min-h-[calc(100vh-125px)] max-w-[1600px] gap-3 p-3 lg:grid-cols-2 sm:p-4">
        <section className="min-h-[50vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">{problem.difficulty}</span><span className="text-xs text-slate-500">C++17</span></div><h2 className="mt-4 text-2xl font-bold text-white">{problem.title}</h2><div className="prose prose-sm prose-invert mt-5 max-w-none"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{problem.description || ''}</ReactMarkdown></div><div className="mt-8"><h3 className="font-semibold text-white">Your submissions</h3>{submissions.length === 0 ? <p className="mt-2 text-sm text-slate-500">No submissions yet.</p> : <div className="mt-3 space-y-2">{submissions.slice(0, 10).map((s) => <div key={s._id} className="flex items-center justify-between rounded-lg border border-slate-800 p-3"><span className="text-sm text-slate-300">{s.status}</span><span className="text-xs text-slate-500">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</span></div>)}</div>}</div></section>
        <section className="flex min-h-[55vh] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900"><div className="min-h-0 flex-1"><MonacoCodeEditor code={code} setCode={setCode} language="cpp" height="100%" /></div><div className="shrink-0 border-t border-slate-800 p-3 sm:p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="text-xs text-slate-500">Custom input</span><textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5} className="mt-1 w-full resize-y rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500" /></label><div><span className="text-xs text-slate-500">Output</span><pre className="mt-1 min-h-32 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">{output || 'Run your code to see output.'}</pre></div></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={run} disabled={running || submitting} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50">{running ? 'Running…' : 'Run'}</button><button onClick={submit} disabled={running || submitting || timeRemaining === 'Contest ended'} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit'}</button>{verdict && <span className="self-center text-sm text-slate-300">{verdict}</span>}</div>{error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}</div></section>
      </div>
    </main>
  );
}

export default function ContestProblemPage() { return <Suspense fallback={<main className="min-h-screen bg-slate-950" />}><ContestProblem /></Suspense>; }
