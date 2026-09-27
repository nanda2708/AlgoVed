'use client';

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { AuthContext } from '../../context/AuthContext.js';
import api, { errorMessage, isCancel, JUDGE_TIMEOUT } from '../../../lib/api';
import Verdict, { describeResult } from '../../components/Verdict';
import TestResults from '../../components/TestResults';

const MonacoCodeEditor = dynamic(() => import('../../components/MonacoCodeEditor.jsx'), { ssr: false });
const STARTER_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`;

const draftKey = (id) => `algoved:draft:${id}`;
const readDraft = (id) => {
  try { return localStorage.getItem(draftKey(id)); } catch { return null; }
};

export default function ProblemPage() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const { id } = useParams();
  const router = useRouter();
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState([]);
  const [code, setCode] = useState(STARTER_CODE);
  const [customInput, setCustomInput] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [judgeResult, setJudgeResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState('problem');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    if (!id) return;
    const draft = readDraft(id);
    if (draft) setCode(draft);

    const controller = new AbortController();
    const config = { signal: controller.signal };
    Promise.all([
      api.get(`/problems/${id}`, config),
      api.get('/submissions', { ...config, params: { problemId: id } }),
      api.get('/comments', { ...config, params: { problemId: id } }),
    ]).then(([problemRes, submissionsRes, commentsRes]) => {
      setProblem(problemRes.data);
      setSubmissions(submissionsRes.data);
      setComments(commentsRes.data);
    }).catch((err) => {
      if (!isCancel(err)) setError(errorMessage(err, 'Unable to load this problem'));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [authLoading, id, isLoggedIn, router]);

  const updateCode = (value) => {
    setCode(value);
    try { localStorage.setItem(draftKey(id), value); } catch { /* storage full or disabled */ }
  };

  const perform = async (kind, action) => {
    setError(''); setBusy(kind);
    try { await action(); } catch (err) { setError(errorMessage(err, 'Request failed')); } finally { setBusy(''); }
  };

  const handleRun = () => perform('run', async () => {
    setJudgeResult(null);
    const { data } = await api.post('/compiler/run', { language: 'cpp', code, input: customInput }, { timeout: 30000 });
    setRunResult(data);
  });

  const handleSamples = () => perform('samples', async () => {
    setRunResult(null);
    const { data } = await api.post('/compiler/samples', { problemId: id, language: 'cpp', code }, { timeout: JUDGE_TIMEOUT });
    setJudgeResult({ ...data, label: 'Sample tests' });
  });

  const handleSubmit = () => perform('submit', async () => {
    setRunResult(null);
    const { data } = await api.post('/submissions', { problemId: id, code, language: 'cpp' }, { timeout: JUDGE_TIMEOUT });
    setSubmissions((items) => [data, ...items]);
    setJudgeResult({ ...data, label: 'Submission' });
  });

  const handleReview = () => perform('review', async () => {
    setReview('');
    const { data } = await api.post('/compiler/ai-review', { code }, { timeout: 60000 });
    setReview(data.review || 'No review was returned.');
  });

  const postComment = () => perform('comment', async () => {
    if (!comment.trim()) return;
    const { data } = await api.post('/comments', { problemId: id, content: comment.trim() });
    setComments((items) => [data, ...items]);
    setComment('');
  });

  if (authLoading || loading) return <main className="flex min-h-[70vh] items-center justify-center bg-slate-950 text-slate-400">Loading problem…</main>;
  if (!problem) return <main className="flex min-h-[70vh] items-center justify-center bg-slate-950 px-4 text-center text-red-400">{error || 'Problem not found'}</main>;

  const samples = (problem.testCases || []).filter((test) => !test.hidden);
  const solved = submissions.some((s) => s.status === 'Accepted');

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:h-[calc(100vh-64px)] lg:flex-row">
        <section className="min-h-0 flex-1 overflow-y-auto border-b border-slate-800 lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/95 p-2 backdrop-blur">
            {[['problem', 'Problem'], ['submissions', `Submissions${submissions.length ? ` (${submissions.length})` : ''}`], ['discussion', 'Discussion']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${tab === key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>{label}</button>
            ))}
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {tab === 'problem' && (
              <article>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold sm:text-3xl">{problem.title}</h1>
                  {solved && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300">Solved</span>}
                </div>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
                  <div><dt className="inline">Difficulty: </dt><dd className="inline text-slate-200">{problem.difficulty}</dd></div>
                  <div><dt className="inline">Time limit: </dt><dd className="inline text-slate-200">{(problem.timeLimitMs || 2000) / 1000} s</dd></div>
                  <div><dt className="inline">Memory limit: </dt><dd className="inline text-slate-200">{problem.memoryLimitMb || 256} MB</dd></div>
                </dl>
                <div className="markdown mt-6"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{problem.description}</ReactMarkdown></div>
                {samples.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold">Examples</h2>
                    <div className="mt-3 space-y-3">
                      {samples.map((t, i) => (
                        <div key={i} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2">
                          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Input</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-slate-200">{t.input}</pre></div>
                          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Output</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-slate-200">{t.output}</pre></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )}

            {tab === 'submissions' && (
              <div>
                <h2 className="text-xl font-semibold">Your submissions</h2>
                {submissions.length === 0 ? <p className="mt-4 text-sm text-slate-500">No submissions yet.</p> : (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead className="bg-slate-900 text-xs text-slate-500"><tr><th className="px-3 py-2">Verdict</th><th className="px-3 py-2">Tests</th><th className="px-3 py-2">Time</th><th className="px-3 py-2">Submitted</th><th /></tr></thead>
                      <tbody>
                        {submissions.map((s) => (
                          <tr key={s._id} className="border-t border-slate-800">
                            <td className="px-3 py-2"><Verdict status={s.status} /></td>
                            <td className="px-3 py-2 text-slate-400">{s.total ? `${s.passed}/${s.total}` : '–'}</td>
                            <td className="px-3 py-2 text-slate-400">{s.timeMs ? `${s.timeMs} ms` : '–'}</td>
                            <td className="px-3 py-2 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right">{s.code && <button onClick={() => setSelected(selected?._id === s._id ? null : s)} className="text-xs text-blue-400 hover:text-blue-300">{selected?._id === s._id ? 'Hide' : 'View'}</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {selected && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Submission from {new Date(selected.createdAt).toLocaleString()}</h3>
                      <button onClick={() => updateCode(selected.code)} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800">Load into editor</button>
                    </div>
                    <pre className="max-h-80 overflow-auto rounded-md border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-200">{selected.code}</pre>
                    <TestResults result={selected} />
                  </div>
                )}
              </div>
            )}

            {tab === 'discussion' && (
              <div>
                <h2 className="text-xl font-semibold">Discussion</h2>
                <div className="mt-4">
                  <label htmlFor="discussion-comment" className="text-sm text-slate-400">Ask a question or share an approach</label>
                  <textarea id="discussion-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={5000} rows={5} className="mt-2 w-full resize-y rounded-md border border-slate-700 bg-slate-900 p-3 text-sm leading-6 outline-none focus:border-blue-500" />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">{comment.length}/5000</span>
                    <button onClick={postComment} disabled={!comment.trim() || busy === 'comment'} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Post</button>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {comments.length ? comments.map((item) => (
                    <article key={item._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span className="font-medium text-slate-300">{item.userId?.username || 'User'}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.content}</p>
                    </article>
                  )) : <p className="text-sm text-slate-500">No comments yet.</p>}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-[560px] min-w-0 flex-1 flex-col bg-slate-950 lg:min-h-0">
          <div className="min-h-[320px] flex-1 p-2 sm:p-3"><MonacoCodeEditor code={code} setCode={updateCode} language="cpp" height="100%" /></div>
          <div className="max-h-[50vh] shrink-0 overflow-y-auto border-t border-slate-800 bg-slate-900 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              <button disabled={!!busy} onClick={handleRun} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{busy === 'run' ? 'Running…' : 'Run'}</button>
              <button disabled={!!busy || samples.length === 0} onClick={handleSamples} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{busy === 'samples' ? 'Testing…' : 'Run samples'}</button>
              <button disabled={!!busy} onClick={handleSubmit} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50">{busy === 'submit' ? 'Judging…' : 'Submit'}</button>
              <button disabled={!!busy} onClick={handleReview} className="ml-auto rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50">{busy === 'review' ? 'Reviewing…' : 'AI review'}</button>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs text-slate-500">Custom input</span>
                <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} rows={4} maxLength={100000} className="mt-1 w-full resize-y rounded-md border border-slate-700 bg-slate-950 p-2 font-mono text-xs outline-none focus:border-blue-500" />
              </label>
              <div>
                <span className="flex items-center justify-between text-xs text-slate-500">
                  <span>Output</span>
                  {runResult && <span>{runResult.verdict === 'OK' ? `${runResult.timeMs} ms` : <Verdict status={runResult.verdict} />}</span>}
                </span>
                <pre className="mt-1 max-h-40 min-h-[88px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-slate-200">
                  {runResult ? (runResult.output || '') + (runResult.verdict !== 'OK' && runResult.error ? `${runResult.output ? '\n' : ''}${runResult.error}` : '') : ''}
                </pre>
              </div>
            </div>

            {judgeResult && (
              <section className="mt-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-400">{judgeResult.label}</span>
                  <span className={judgeResult.status === 'Accepted' ? 'text-emerald-400' : 'text-slate-200'}>
                    {judgeResult.label === 'Submission' ? describeResult(judgeResult) : `${judgeResult.passed}/${judgeResult.total} passed`}
                  </span>
                </div>
                <TestResults result={judgeResult} />
              </section>
            )}

            {error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}
            {review && (
              <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-4">
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">AI review</span><button onClick={() => setReview('')} className="text-xs text-slate-500 hover:text-white">Close</button></div>
                <div className="markdown text-sm"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{review}</ReactMarkdown></div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
