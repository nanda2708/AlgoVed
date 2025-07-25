'use client';
import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext.js';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaClock, FaTrophy, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

export default function ContestDetails() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const { id } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const fetchContestData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        if (!id) throw new Error('No contest ID provided');

        // Fetch contest details
        const contestRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Contest response:', contestRes.data);
        setContest(contestRes.data);
        setHasJoined(contestRes.data.hasJoined || false);

        // Fetch problems
        const problemRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/problems`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { ids: contestRes.data.problems.join(',') },
        });
        console.log('Problems response:', problemRes.data);
        setProblems(Array.isArray(problemRes.data) ? problemRes.data : []);

        // Fetch contest submissions
        const submissionsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/contestSubmissions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { contestId: id },
        });
        console.log('Submissions response:', submissionsRes.data);
        setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);

        // Fetch leaderboard
        const leaderboardRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/contestSubmissions/leaderboard/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Leaderboard response:', leaderboardRes.data);
        setLeaderboard(Array.isArray(leaderboardRes.data) ? leaderboardRes.data : []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load contest data');
      } finally {
        setLoading(false);
      }
    };

    fetchContestData();
  }, [id, isLoggedIn, authLoading, router]);

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

  const handleJoinContest = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contests/${id}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Joined contest:', id);
      setHasJoined(true);
    } catch (err) {
      console.error('Join error:', err);
      setError(err.response?.data?.message || 'Failed to join contest');
    }
  };

  const getContestStatus = () => {
    if (!contest) return '';
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'ended';
  };

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
  if (!contest) return (
    <div className="flex items-center justify-center h-screen text-red-500 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" role="alert">
      Contest not found
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 font-sans p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">{contest.title}</h1>
        <div className="flex items-center gap-4 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Status: <span className={`font-semibold ${
              getContestStatus() === 'ongoing' ? 'text-green-500' :
              getContestStatus() === 'upcoming' ? 'text-yellow-500' : 'text-red-500'
            }`}>{getContestStatus()}</span>
          </p>
          {contest.status === 'ongoing' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <FaClock className="inline mr-1" /> Time Remaining: {timeRemaining}
            </p>
          )}
        </div>

        {/* Join Button */}
        {contest.status === 'ongoing' && !hasJoined && (
          <motion.button
            onClick={handleJoinContest}
            className="mb-6 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Join Contest
          </motion.button>
        )}

        {/* Tabs */}
        <div className="flex gap-3 mb-6 bg-slate-900 text-white p-4 rounded-lg shadow-md">
          {['overview', 'problems', 'submissions', 'leaderboard'].map((tab) => (
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
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-4 sm:p-6 shadow-lg"
            >
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Overview</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Start Time:</strong> {new Date(contest.startTime).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>End Time:</strong> {new Date(contest.endTime).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Duration:</strong> {Math.round(contest.duration / 3600)} hours
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Problems:</strong> {contest.problems.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Participants:</strong> {contest.participants.length}
              </p>
            </motion.div>
          )}

          {activeTab === 'problems' && (
            <motion.div
              key="problems"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-4 sm:p-6 shadow-lg"
            >
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Problems</h2>
              {problems.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">No problems available.</p>
              ) : (
                <ul className="space-y-3">
                  {problems.map((problem) => {
                    const submission = submissions.find(s => s.problemId._id.toString() === problem._id.toString() && s.status === 'Accepted');
                    return (
                      <motion.li
                        key={problem._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-800"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {submission ? (
                              <FaCheckCircle className="text-green-500" title="Solved" />
                            ) : (
                              <FaTimesCircle className="text-red-500" title="Not Solved" />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{problem.title}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                Difficulty: <span className={`font-semibold ${
                                  problem.difficulty === 'Easy' ? 'text-green-500' :
                                  problem.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                                }`}>{problem.difficulty}</span>
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => router.push(`/compete/${id}/${problem._id}`)}
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Solve
                          </motion.button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}

          {activeTab === 'submissions' && (
            <motion.div
              key="submissions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-4 sm:p-6 shadow-lg"
            >
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Submissions</h2>
              {submissions.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">No submissions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {submissions.map((submission) => (
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
                        <strong>Problem:</strong> {submission.problemId.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        <strong>Language:</strong> {submission.language}
                      </p>
                      <details className="mt-2">
                        <summary className="text-sm text-blue-500 hover:underline cursor-pointer">View Code</summary>
                        <pre className="text-xs font-mono bg-slate-100 dark:bg-slate-600 p-2 rounded-md mt-1 overflow-x-auto">
                          {submission.code}
                        </pre>
                      </details>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">🏆 Leaderboard</h2>
              {leaderboard.length === 0 ? (
                <div className="text-center text-slate-600 dark:text-slate-400">
                  No leaderboard data available.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                      {leaderboard.map((entry, index) => (
                        <tr
                          key={entry.userId}
                          className={`transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${
                            index < 3 ? 'font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block w-6 text-center rounded-full ${
                                index === 0
                                  ? 'bg-yellow-300 text-yellow-900'
                                  : index === 1
                                  ? 'bg-gray-300 text-gray-800'
                                  : index === 2
                                  ? 'bg-orange-400 text-orange-900'
                                  : ''
                              }`}
                            >
                              {entry.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">{entry.username}</td>
                          <td className="py-3 px-4">{entry.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}