'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { AuthContext } from '../context/AuthContext';
import api, { errorMessage } from '../../lib/api';
import Verdict from '../components/Verdict';

const MonacoCodeEditor = dynamic(() => import('../components/MonacoCodeEditor'), { ssr: false });
const DRAFT_KEY = 'algoved:draft:playground';
const STARTER_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    string name;
    getline(cin, name);
    cout << "Hello, " << name << "!" << endl;
    return 0;
}
`;

export default function Playground() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [code, setCode] = useState(STARTER_CODE);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace('/login');
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setCode(draft);
    } catch { /* storage unavailable */ }
  }, []);

  const updateCode = (value) => {
    setCode(value);
    try { localStorage.setItem(DRAFT_KEY, value); } catch { /* storage unavailable */ }
  };

  const perform = async (kind, action) => {
    setBusy(kind); setError('');
    try { await action(); } catch (err) { setError(errorMessage(err, 'Request failed')); } finally { setBusy(''); }
  };

  const run = () => perform('run', async () => {
    const { data } = await api.post('/compiler/run', { language: 'cpp', code, input }, { timeout: 30000 });
    setResult(data);
  });

  const requestReview = () => perform('review', async () => {
    const { data } = await api.post('/compiler/ai-review', { code }, { timeout: 60000 });
    setReview(data.review || 'No review was returned.');
  });

  if (authLoading || !isLoggedIn) return null;

  return (
    <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 lg:h-[calc(100vh-64px)]">
      <div className="grid h-full gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="min-h-0 flex-1"><MonacoCodeEditor code={code} setCode={updateCode} language="cpp" height="100%" /></div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-800 p-3">
            <span className="text-xs text-slate-500">g++ -std=c++17 -O2 · 2 s · 256 MB</span>
            <div className="flex gap-2">
              <button onClick={requestReview} disabled={!!busy} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">{busy === 'review' ? 'Reviewing…' : 'AI review'}</button>
              <button onClick={run} disabled={!!busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{busy === 'run' ? 'Running…' : 'Run'}</button>
            </div>
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <label htmlFor="stdin" className="text-sm font-medium text-white">stdin</label>
            <textarea id="stdin" value={input} onChange={(e) => setInput(e.target.value)} rows={6} className="mt-2 w-full resize-y rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500" />
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white">stdout</h2>
              {result && (result.verdict === 'OK' ? <span className="text-xs text-slate-500">{result.timeMs} ms</span> : <Verdict status={result.verdict} className="text-xs" />)}
            </div>
            <pre className="mt-2 max-h-72 min-h-[96px] overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 font-mono text-xs text-slate-200">{result?.output}</pre>
            {result?.error && (
              <>
                <h3 className="mt-3 text-xs font-medium text-slate-400">{result.verdict === 'OK' ? 'stderr' : 'Error'}</h3>
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 font-mono text-xs text-amber-200">{result.error}</pre>
              </>
            )}
          </section>

          {error && <p className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300" role="alert">{error}</p>}

          {review && (
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-white">AI review</h2><button onClick={() => setReview('')} className="text-xs text-slate-500 hover:text-white">Dismiss</button></div>
              <div className="markdown mt-2 text-sm"><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{review}</ReactMarkdown></div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
