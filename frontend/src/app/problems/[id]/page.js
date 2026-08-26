'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { AuthContext } from '../../context/AuthContext.js';

const MonacoCodeEditor = dynamic(() => import('../../components/MonacoCodeEditor.jsx'), { ssr: false });
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const STARTER_CODE = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b;\n    return 0;\n}`;

export default function ProblemPage() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const { id } = useParams();
  const router = useRouter();
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState([]);
  const [code, setCode] = useState(STARTER_CODE);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [sampleResults, setSampleResults] = useState([]);
  const [verdict, setVerdict] = useState('');
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState('problem');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState('');

  const authConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    return { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    if (!id) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const config = { ...authConfig(), signal: controller.signal };
        const [problemRes, submissionsRes, commentsRes] = await Promise.all([
          axios.get(`${API_URL}/api/problems/${id}`, config),
          axios.get(`${API_URL}/api/submissions`, { ...config, params: { problemId: id } }),
          axios.get(`${API_URL}/api/comments`, { ...config, params: { problemId: id } }),
        ]);
        setProblem(problemRes.data);
        setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
        setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') setError(err.response?.data?.message || 'Unable to load this problem');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [authConfig, authLoading, id, isLoggedIn, router]);

  const run = async (input) => {
    const res = await axios.post(`${API_URL}/api/compiler/run`, { language: 'cpp', code, input }, authConfig());
    return res.data?.output ?? '';
  };

  const handleRun = async () => {
    setError(''); setVerdict(''); setOutput(''); setSampleResults([]); setRunning(true);
    try {
      const result = await run(customInput);
      setOutput(result);
      setVerdict('Execution completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Code execution failed');
      setVerdict('Execution failed');
    } finally { setRunning(false); }
  };

  const handleSamples = async () => {
    setError(''); setVerdict(''); setOutput(''); setSampleResults([]); setRunning(true);
    try {
      const samples = (problem?.testCases || []).filter((test) => !test.hidden);
      if (!samples.length) { setVerdict('No sample tests available'); return; }
      const results = [];
      for (const test of samples) {
        try {
          const actual = await run(test.input || '');
          const expected = String(test.output || '');
          results.push({ input: test.input || '', expected, actual, passed: actual.trim() === expected.trim() });
        } catch (sampleError) {
          results.push({ input: test.input || '', expected: String(test.output || ''), actual: sampleError.response?.data?.message || 'Execution failed', passed: false });
        }
      }
      const passed = results.filter((result) => result.passed).length;
      setSampleResults(results);
      setVerdict(`${passed}/${samples.length} sample tests passed`);
    } catch (err) {
      setError(err.response?.data?.message || 'Sample execution failed');
      setVerdict('Execution failed');
    } finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    setError(''); setVerdict(''); setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/submissions`, { problemId: id, code, language: 'cpp' }, { ...authConfig(), timeout: 30000 });
      setSubmissions((items) => [res.data, ...items]);
      setVerdict(res.data?.status || 'Submitted');
      setTab('submissions');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setVerdict('Submission failed');
    } finally { setSubmitting(false); }
  };

  const handleReview = async () => {
    setError(''); setReview(''); setReviewing(true);
    try {
      const res = await axios.post(`${API_URL}/api/compiler/ai-review`, { code }, { ...authConfig(), timeout: 30000 });
      setReview(res.data?.review || 'No review was returned.');
    } catch (err) {
      setError(err.response?.data?.message || 'Code review failed');
    } finally { setReviewing(false); }
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/api/comments`, { problemId: id, content: comment.trim() }, authConfig());
      setComments((items) => [res.data, ...items]);
      setComment('');
    } catch (err) { setError(err.response?.data?.message || 'Could not post comment'); }
  };

  if (authLoading || loading) return <main className="flex min-h-[70vh] items-center justify-center bg-slate-950 text-slate-400">Loading problem…</main>;
  if (!problem) return <main className="flex min-h-[70vh] items-center justify-center bg-slate-950 px-4 text-center text-red-400">{error || 'Problem not found'}</main>;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1600px] flex-col lg:flex-row">
        <section className="min-h-0 flex-1 overflow-y-auto border-b border-slate-800 lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/95 p-2 backdrop-blur">
            {['problem', 'submissions', 'discussion'].map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium capitalize ${tab === item ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>{item}</button>)}
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            {tab === 'problem' && <article>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold sm:text-3xl">{problem.title}</h1><p className="mt-2 text-sm text-slate-400">Difficulty: <span className="font-medium text-slate-200">{problem.difficulty}</span></p></div></div>
              <div className="prose prose-sm prose-invert mt-6 max-w-none sm:prose-base"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{problem.description}</ReactMarkdown></div>
              {!!problem.testCases?.length && <div className="mt-8"><h2 className="text-lg font-semibold">Examples</h2><div className="mt-3 space-y-3">{problem.testCases.filter((t) => !t.hidden).map((t, i) => <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Input</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm text-slate-200">{t.input}</pre><p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Output</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm text-slate-200">{t.output}</pre></div>)}</div></div>}
            </article>}
            {tab === 'submissions' && <div><h2 className="text-xl font-semibold">Your submissions</h2><div className="mt-4 space-y-2">{submissions.length ? submissions.map((s) => <div key={s._id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3"><span className={s.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}>{s.status}</span><span className="text-xs text-slate-500">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</span></div>) : <p className="text-sm text-slate-500">No submissions yet.</p>}</div></div>}
            {tab === 'discussion' && <div><h2 className="text-xl font-semibold">Discussion</h2><div className="mt-4"><label htmlFor="discussion-comment" className="text-sm text-slate-400">Share a question, explanation, or approach</label><textarea id="discussion-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={6} placeholder="Write your comment here…" className="mt-2 min-h-36 w-full resize-y rounded-md border border-slate-700 bg-slate-900 p-3 text-sm leading-6 outline-none focus:border-blue-500" /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-500">{comment.length}/2000</span><button onClick={postComment} disabled={!comment.trim()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Post comment</button></div></div><div className="mt-5 space-y-3">{comments.length ? comments.map((item) => <article key={item._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{item.userId?.username || 'User'}</span><span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.content}</p></article>) : <p className="text-sm text-slate-500">No discussion yet.</p>}</div></div>}
          </div>
        </section>

        <section className="flex min-h-[520px] min-w-0 flex-1 flex-col bg-slate-950 lg:min-h-0">
          <div className="min-h-0 flex-1 p-2 sm:p-3"><MonacoCodeEditor code={code} setCode={setCode} language="cpp" height="100%" /></div>
          <div className="shrink-0 border-t border-slate-800 bg-slate-900 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2"><button disabled={running || submitting} onClick={handleRun} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{running ? 'Running…' : 'Run input'}</button><button disabled={running || submitting} onClick={handleSamples} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">Run samples</button><button disabled={running || submitting} onClick={handleSubmit} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit'}</button><button disabled={reviewing} onClick={handleReview} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{reviewing ? 'Reviewing…' : 'Review code'}</button></div>
            <div className="mt-3 grid gap-3 md:grid-cols-2"><label><span className="text-xs text-slate-500">Custom input</span><textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} rows={3} maxLength={100000} className="mt-1 w-full resize-y rounded-md border border-slate-700 bg-slate-950 p-2 font-mono text-xs outline-none focus:border-blue-500" placeholder="Input passed to your program" /></label><div><span className="text-xs text-slate-500">Output</span><pre className="mt-1 min-h-20 max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">{output || (sampleResults.length ? verdict : 'Run your code to see output.')}</pre></div></div>
            {sampleResults.length > 0 && <section className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-white">Sample test results</h2><span className="text-xs text-slate-400">{verdict}</span></div><div className="mt-3 space-y-3">{sampleResults.map((result, index) => <article key={index} className={`rounded-md border p-3 ${result.passed ? 'border-emerald-900/70 bg-emerald-950/20' : 'border-red-900/70 bg-red-950/20'}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Case {index + 1}</span><span className={result.passed ? 'text-xs font-medium text-emerald-400' : 'text-xs font-medium text-red-400'}>{result.passed ? 'Passed' : 'Failed'}</span></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Input</p><pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-2 font-mono text-xs text-slate-200">{result.input || '(empty)'}</pre></div><div><p className="text-xs text-slate-500">Expected output</p><pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-2 font-mono text-xs text-slate-200">{result.expected || '(empty)'}</pre></div><div><p className="text-xs text-slate-500">Your output</p><pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-2 font-mono text-xs text-slate-200">{result.actual || '(empty)'}</pre></div></div></article>)}</div></section>}
            {error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}
            {review && <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">Code review</span><button onClick={() => setReview('')} className="text-xs text-slate-500 hover:text-white">Close</button></div><div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{review}</ReactMarkdown></div></div>}
          </div>
        </section>
      </div>
    </main>
  );
}
