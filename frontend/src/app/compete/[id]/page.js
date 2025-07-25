'use client';
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext.js';
import dynamic from 'next/dynamic';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaSort, FaClock } from 'react-icons/fa';

const MonacoCodeEditor = dynamic(() => import('../../components/MonacoCodeEditor.jsx'), { ssr: false });

export default function ContestProblem() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const { id, problemId } = useParams();
  const router = useRouter();
  const [problem, setProblem] = useState(null);
  const [contest, setContest] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(`#include <iostream>
using namespace std;

int main() {
    int num1, num2, sum;
    cin >> num1 >> num2;
    sum = num1 + num2;
    cout << sum;
    return 0;
}`);
  const [language, setLanguage] = useState('cpp');
  const [activeTab, setActiveTab] = useState('problem');
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [testCaseResults, setTestCaseResults] = useState([]);
  const [verdict, setVerdict] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [panelWidth, setPanelWidth] = useState(50);
  const [sortBy, setSortBy] = useState('date-desc');
  const [timeRemaining, setTimeRemaining] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const fetchProblemAndData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        if (!id || !problemId) throw new Error('Missing contest or problem ID');

        // Fetch contest details
        const contestRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContest(contestRes.data);

        // Fetch problem details
        const problemRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/${problemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProblem(problemRes.data);

        // Fetch contest submissions
        setLoadingSubmissions(true);
        const submissionsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/contestSubmissions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { contestId: id, problemId },
        });
        console.log('Submissions response:', submissionsRes.data);
        setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
        setLoadingSubmissions(false);
      }
    };

    fetchProblemAndData();
  }, [id, problemId, isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (!contest || contest.status !== 'ongoing') return;
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(contest.endTime);
      const diff = end - now;
      if (diff <= 0) {
        setTimeRemaining('Contest ended');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const handleRun = async () => {
    setError('');
    setOutput('');
    setVerdict('');
    setTestCaseResults([]);
    setLoadingRun(true);

    try {
      if (activeTestCase === 'custom') {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_COMPILER_API_URL}/run`, {
          language,
          code,
          input: customInput,
        });
        setOutput(res.data.output);
        setVerdict('Custom input executed');
      } else {
        const visibleTestCases = problem.testCases.filter((tc) => !tc.hidden);
        const results = [];
        let allPassed = true;

        for (let i = 0; i < visibleTestCases.length; i++) {
          const input = visibleTestCases[i].input;
          const res = await axios.post(`${process.env.NEXT_PUBLIC_COMPILER_API_URL}/run`, {
            language,
            code,
            input,
          });
          const passed = res.data.output.trim() === visibleTestCases[i].output.trim();
          results[i] = {
            input,
            expected: visibleTestCases[i].output,
            actual: res.data.output,
            passed,
            status: passed ? 'Accepted' : 'Wrong Answer',
          };
          if (!passed) allPassed = false;
        }

        setTestCaseResults(results);
        setVerdict(allPassed ? 'All sample test cases passed' : `${results.filter((r) => r.passed).length}/${visibleTestCases.length} test cases passed`);
        setActiveTestCase(0);
      }
    } catch (err) {
      console.error('Run error:', err);
      setError(err.response?.data?.error || 'Failed to run code');
      setVerdict('Error running test cases');
    } finally {
      setLoadingRun(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setVerdict('');
    setLoadingSubmit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contestSubmissions`,
        { contestId: id, problemId, code, language },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Submission response:', res.data);
      setSubmissions((prev) => [res.data, ...prev]);
      setActiveTab('submissions');
      setVerdict(res.data.status === 'Accepted' ? 'Accepted' : 'Wrong Answer');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Submission failed');
      setVerdict('Submission failed');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'status-accepted') return a.status === 'Accepted' ? -1 : 1;
    if (sortBy === 'status-wrong') return a.status === 'Wrong Answer' ? -1 : 1;
    return 0;
  });

  if (authLoading || loading) return (
    <div className="flex items-center justify-center h-screen text-slate-600 dark:text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <FaSpinner className="animate-spin mr-2" /> Loading...
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-screen text-red-500 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" role="alert">
      {error}
    </div>
  );
  if (!problem || !contest) return (
    <div className="flex items-center justify-center h-screen text-red-500 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" role="alert">
      Problem or contest not found
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 font-sans" ref={containerRef}>
      {/* Left Panel */}
      <motion.div
        className="flex flex-col h-full bg-white dark:bg-slate-800 shadow-2xl border-r border-slate-200 dark:border-slate-600"
        style={{ width: `${panelWidth}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Tabs */}
        <div className="flex gap-3 p-4 bg-slate-900 text-white shadow-md">
          {['problem', 'submissions'].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize text-sm sm:text-base ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              } transition-colors duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'problem' && (
              <motion.div
                key="problem"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-700 shadow-lg rounded-xl p-4 sm:p-6"
              >
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-3">{problem.title}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Contest: {contest.title} | Time Remaining: <span className="font-semibold">{timeRemaining}</span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Difficulty: <span className={`font-semibold ${
                    problem.difficulty === 'Easy' ? 'text-green-500' : 
                    problem.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                  }`}>{problem.difficulty}</span>
                </p>
                <div className="prose prose-sm dark:prose-invert text-slate-700 dark:text-slate-200">
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <ReactMarkdown>{problem.description}</ReactMarkdown>
                  {problem.testCases?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-md font-semibold">Sample Test Cases</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {problem.testCases
                          .filter((tc) => !tc.hidden)
                          .map((tc, i) => (
                            <li key={i} className="text-sm">
                              <strong>Input:</strong> <pre className="inline-block bg-slate-100 dark:bg-slate-600 px-2 rounded-md">{tc.input}</pre><br />
                              <strong>Output:</strong> <pre className="inline-block bg-slate-100 dark:bg-slate-600 px-2 rounded-md">{tc.output}</pre>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'submissions' && (
              <motion.div
                key="submissions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-700 shadow-lg rounded-xl p-4 sm:p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Submissions</h2>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="status-accepted">Accepted</option>
                    <option value="status-wrong">Wrong Answer</option>
                  </select>
                </div>
                {loadingSubmissions ? (
                  <div className="text-center text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" /> Loading submissions...
                  </div>
                ) : submissions.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400">No submissions yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {sortedSubmissions.map((submission) => (
                      <motion.li
                        key={submission._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {submission.status === 'Accepted' ? (
                              <FaCheckCircle className="text-green-500" />
                            ) : (
                              <FaTimesCircle className="text-red-500" />
                            )}
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {submission.status}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(submission.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          <strong>Language:</strong> {submission.language}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          <strong>UUID:</strong> {submission.codeUUID}
                        </p>
                        {submission.code && (
                          <details className="mt-2">
                            <summary className="text-sm text-blue-500 hover:underline cursor-pointer">View Code</summary>
                            <pre className="text-xs font-mono bg-slate-100 dark:bg-slate-600 p-2 rounded-md mt-1 overflow-x-auto">
                              {submission.code}
                            </pre>
                          </details>
                        )}
                        {submission.testCaseResults?.length > 0 && (
                          <div className="mt-2">
                            <h3 className="text-sm font-semibold">Test Case Results</h3>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              {submission.testCaseResults.map((tc, i) => (
                                <li key={i} className={tc.passed ? 'text-green-500' : 'text-red-500'}>
                                  Test Case {i + 1}: {tc.status} {tc.passed ? '' : `(Expected: ${tc.expected}, Got: ${tc.actual})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Right Panel */}
      <div className="flex flex-col h-full bg-white dark:bg-slate-800" style={{ width: `${100 - panelWidth}%` }}>
        {/* Panel Width Controls */}
        <div className="flex justify-end gap-2 p-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
          <motion.button
            onClick={() => setPanelWidth(Math.max(30, panelWidth - 10))}
            className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Expand Code
          </motion.button>
          <motion.button
            onClick={() => setPanelWidth(Math.min(70, panelWidth + 10))}
            className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Expand Problem →
          </motion.button>
        </div>

        {/* Code Editor */}
        <div className="h-1/2 p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Code Editor</label>
          <div className="h-[calc(100%-2rem)] bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
            <MonacoCodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              height="100%"
            />
          </div>
        </div>

        {/* Test Cases and Results */}
        <div className="h-1/2 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-2 mb-3">
            {problem.testCases.filter((tc) => !tc.hidden).map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveTestCase(i)}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  activeTestCase === i ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                } transition-colors duration-200`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Test Case {i + 1}
              </motion.button>
            ))}
            <motion.button
              onClick={() => setActiveTestCase('custom')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                activeTestCase === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
              } transition-colors duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Custom Input
            </motion.button>
          </div>

          <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow-md">
            {activeTestCase === 'custom' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Custom Input</label>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input..."
                  className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  rows="4"
                  aria-label="Custom Test Case Input"
                />
                {output && (
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Output</h3>
                    <pre className="text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 p-2 rounded-md whitespace-pre-wrap">{output}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Input</h3>
                <pre className="text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 p-2 rounded-md mb-2 whitespace-pre-wrap">
                  {problem.testCases[activeTestCase]?.input}
                </pre>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Expected Output</h3>
                <pre className="text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 p-2 rounded-md mb-2 whitespace-pre-wrap">
                  {problem.testCases[activeTestCase]?.output}
                </pre>
                {testCaseResults[activeTestCase] && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Actual Output</h3>
                    <pre
                      className={`text-sm font-mono bg-slate-100 dark:bg-slate-600 p-2 rounded-md whitespace-pre-wrap ${
                        testCaseResults[activeTestCase].passed ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {testCaseResults[activeTestCase].actual}
                    </pre>
                    <p className={`mt-2 text-sm ${testCaseResults[activeTestCase].passed ? 'text-green-500' : 'text-red-500'}`}>
                      {testCaseResults[activeTestCase].status}
                    </p>
                  </div>
                )}
              </div>
            )}
            {verdict && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-md text-sm ${
                  verdict.includes('All sample test cases passed') || verdict === 'Accepted'
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    : verdict === 'Custom input executed' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                }`}
              >
                <strong>Verdict:</strong> {verdict}
              </motion.div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <motion.button
              onClick={handleRun}
              disabled={loadingRun || loadingSubmit}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loadingRun && <FaSpinner className="animate-spin" />}
              Run Code
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              disabled={loadingRun || loadingSubmit || contest.status !== 'ongoing'}
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-green-300 transition-colors duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loadingSubmit && <FaSpinner className="animate-spin" />}
              Submit
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}