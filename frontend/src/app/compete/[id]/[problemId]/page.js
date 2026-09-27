'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { AuthContext } from '../../../context/AuthContext.js';
import api, { errorMessage, isCancel, JUDGE_TIMEOUT } from '../../../../lib/api';
import { formatDuration } from '../../../../lib/time';
import useCountdown from '../../../components/useCountdown';
import Verdict, { describeResult } from '../../../components/Verdict';
import TestResults from '../../../components/TestResults';

const MonacoCodeEditor = dynamic(() => import('../../../components/MonacoCodeEditor.jsx'), { ssr: false });
const STARTER_CODE = '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n';

export default function ContestProblemPage() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const { id, problemId } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [code, setCode] = useState(STARTER_CODE);
  const [input, setInput] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const remaining = useCountdown(contest?.endTime);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isLoggedIn) { router.replace('/login'); return undefined; }
    const controller = new AbortController();
    const config = { signal: controller.signal };
    Promise.all([
      api.get(`/contests/${id}`, config),
      api.get(`/problems/${problemId}`, config),
      api.get('/contest-submissions', { ...config, params: { contestId: id, problemId } }),
    ]).then(([contestRes, problemRes, submissionsRes]) => {
      setContest(contestRes.data);
      setProblem(problemRes.data);
      setSubmissions(submissionsRes.data);
    }).catch((err) => {
      if (!isCancel(err)) setError(errorMessage(err, 'Failed to load contest problem'));
    });
    return () => controller.abort();
  }, [authLoading, isLoggedIn, id, problemId, router]);

  const run = async () => {
    setBusy('run'); setError('');
    try {
      const { data } = await api.post('/compiler/run', { language: 'cpp', code, input }, { timeout: 30000 });
      setRunResult(data);
    } catch (err) {
      setError(errorMessage(err, 'Failed to run code'));
    } finally {
      setBusy('');
    }
  };

  const submit = async () => {
    setBusy('submit'); setError('');
    try {
      const { data } = await api.post('/contest-submissions', { contestId: id, problemId, code, language: 'cpp' }, { timeout: JUDGE_TIMEOUT });
      setSubmissions((prev) => [data, ...prev]);
      setLastSubmission(data);
    } catch (err) {
      setError(errorMessage(err, 'Submission failed'));
    } finally {
      setBusy('');
    }
  };

  if (!contest || !problem) return <main className="p-8 text-center text-slate-400">{error || 'Loading…'}</main>;

  const ended = remaining <= 0;
  const index = contest.problems.findIndex((p) => p._id === problemId);

  return (
    <main className="min-h-[calc(100vh-64px)] text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <Link href={`/compete/${id}`} className="text-sm text-slate-400 hover:text-white">← {contest.title}</Link>
          <span className="font-mono text-sm">{ended ? 'Contest over' : `${formatDuration(remaining)} left`}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-3 p-3 sm:p-4 lg:h-[calc(100vh-120px)] lg:grid-cols-2">
        <section className="overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-white">{index >= 0 && <span className="mr-2 text-slate-500">{String.fromCharCode(65 + index)}.</span>}{problem.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{problem.difficulty} · {(problem.timeLimitMs || 2000) / 1000} s · {problem.memoryLimitMb || 256} MB</p>
          <div className="markdown mt-5"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{problem.description}</ReactMarkdown></div>
          {(problem.testCases || []).map((t, i) => (
            <div key={i} className="mt-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4 sm:grid-cols-2">
              <div><p className="text-xs uppercase text-slate-500">Input</p><pre className="mt-1 whitespace-pre-wrap font-mono text-sm">{t.input}</pre></div>
              <div><p className="text-xs uppercase text-slate-500">Output</p><pre className="mt-1 whitespace-pre-wrap font-mono text-sm">{t.output}</pre></div>
            </div>
          ))}

          <h2 className="mt-8 font-semibold text-white">Your submissions</h2>
          {submissions.length === 0 ? <p className="mt-2 text-sm text-slate-500">None yet.</p> : (
            <ul className="mt-2 divide-y divide-slate-800 text-sm">
              {submissions.map((s) => (
                <li key={s._id} className="flex justify-between py-2">
                  <Verdict status={s.status} />
                  <span className="text-xs text-slate-500">{s.timeMs ? `${s.timeMs} ms · ` : ''}{new Date(s.createdAt).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 lg:min-h-0">
          <div className="min-h-[300px] flex-1"><MonacoCodeEditor code={code} setCode={setCode} language="cpp" height="100%" /></div>
          <div className="max-h-[45vh] shrink-0 overflow-y-auto border-t border-slate-800 p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-slate-500">Custom input</span>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} className="mt-1 w-full resize-y rounded-md border border-slate-700 bg-slate-950 p-2 font-mono text-xs outline-none focus:border-blue-500" />
              </label>
              <div>
                <span className="text-xs text-slate-500">Output {runResult && runResult.verdict !== 'OK' && <Verdict status={runResult.verdict} className="ml-2" />}</span>
                <pre className="mt-1 max-h-32 min-h-[88px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950 p-2 font-mono text-xs">
                  {runResult ? [runResult.output, runResult.verdict !== 'OK' ? runResult.error : ''].filter(Boolean).join('\n') : ''}
                </pre>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={run} disabled={!!busy} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{busy === 'run' ? 'Running…' : 'Run'}</button>
              <button onClick={submit} disabled={!!busy || ended} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{busy === 'submit' ? 'Judging…' : 'Submit'}</button>
              {lastSubmission && <span className="text-sm">{describeResult(lastSubmission)}</span>}
            </div>
            {lastSubmission && lastSubmission.status !== 'Accepted' && <div className="mt-3"><TestResults result={lastSubmission} /></div>}
            {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
