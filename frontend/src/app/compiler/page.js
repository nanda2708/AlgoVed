'use client';
import { useState, useEffect, useContext, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import dynamic from 'next/dynamic';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

const MonacoCodeEditor = dynamic(() => import('../components/MonacoCodeEditor'), { ssr: false });

const Compiler = () => {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [code, setCode] = useState(`#include <iostream>
using namespace std;

int main() {
    int num1, num2, sum;
    cin >> num1 >> num2;
    sum = num1 + num2;
    cout << "The sum of the two numbers is: " << sum;
    return 0;
}`);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [language, setLanguage] = useState('cpp');

  const COMPILER_API_URL = process.env.NEXT_PUBLIC_COMPILER_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRun = async () => {
    setError('');
    setOutput('');
    setLoadingRun(true);
    try {
      const res = await axios.post(`${COMPILER_API_URL}/run`, {
        language,
        code,
        input,
      });
      setOutput(res.data.output || '');
    } catch (err) {
      console.error('Run error:', err);
      setError(err.response?.data?.error || 'Failed to run code');
    } finally {
      setLoadingRun(false);
    }
  };

  const handleAiReview = async () => {
    setError('');
    setAiReview('');
    setLoadingReview(true);
    try {
      const res = await axios.post(`${COMPILER_API_URL}/ai-review`, { code });
      const reviewText = typeof res.data.review === 'string' ? res.data.review : String(res.data.review || '');
      setAiReview(reviewText);
      showToast('✅ AI Review Complete!');
    } catch (err) {
      console.error('AI Review Error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to get AI review');
    } finally {
      setLoadingReview(false);
    }
  };

  if (authLoading || !isLoggedIn) {
    return <div className="text-center mt-10 text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {toast && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-md z-50 animate-slide-down"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">AlgoU Online Compiler</h1>

      {error && (
        <div className="text-red-500 text-center mb-6 font-medium" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor */}
        <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 flex flex-col">
          <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Code Editor
          </label>
          <div className="bg-gray-900 rounded-lg overflow-hidden flex-grow" style={{ minHeight: '400px' }}>
            <MonacoCodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              height="400px"
            />
          </div>
        </div>

        {/* Input / Output / AI Review / Buttons */}
        <div className="flex flex-col gap-4">
          {/* Input */}
          <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4">
            <label htmlFor="input" className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Input
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input values..."
              className="w-full p-3 text-sm border border-gray-300 dark:border-gray-700 rounded-md resize-none font-mono bg-white dark:bg-gray-800 text-black dark:text-white"
              rows="4"
              aria-label="Program Input"
            />
          </div>

          {/* Output */}
          <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 overflow-y-auto" style={{ maxHeight: '150px' }}>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Output</h2>
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
              {output || '🧪 Run code to see output here...'}
            </pre>
          </div>

          {/* AI Review */}
          <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 overflow-y-auto" style={{ maxHeight: '200px' }}>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">AI Code Review</h2>
            {loadingReview ? (
              <div className="text-center text-gray-600 dark:text-gray-400">Analyzing your code...</div>
            ) : aiReview ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-100">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{aiReview}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">🤖 Click "AI Review" to analyze your code.</div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleRun}
              disabled={loadingRun || loadingReview}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {loadingRun ? 'Running...' : 'Run Code'}
            </button>
            <button
              onClick={handleAiReview}
              disabled={loadingRun || loadingReview}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition"
            >
              {loadingReview ? 'Reviewing...' : 'AI Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap Compiler in Suspense for useRouter
export default function CompilerWrapper() {
  return (
    <Suspense fallback={
      <div className="text-center mt-10 text-gray-600 dark:text-gray-400">Loading...</div>
    }>
      <Compiler />
    </Suspense>
  );
}