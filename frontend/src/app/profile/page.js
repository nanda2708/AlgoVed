'use client';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authLoading, isLoggedIn, router, API_URL]);

  if (authLoading || loading) return <div className="text-center mt-20 text-white">Loading profile...</div>;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;
  if (!user) return <div className="text-center mt-20 text-red-500">No user data available</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Compact Header with Grid Background */}
      <div className="relative h-40 sm:h-48 w-full">
        <div className="absolute inset-0">
          <div className="relative h-full w-full bg-slate-950 [&>div]:absolute [&>div]:inset-0 [&>div]:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [&>div]:bg-[size:14px_24px]">
            <div></div>
          </div>
        </div>

        <div className="relative z-10 h-full flex items-center text-white px-6 sm:px-40">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-semibold">{user.fullName}</h1>
              <p className="text-slate-300">@{user.username}</p>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold">📊 Your Stats</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{user.currentStreak || 0}</p>
                <p className="text-sm">Current Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{user.maxStreak || 0}</p>
                <p className="text-sm">Max Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-500">{user.problemsSolved || 0}</p>
                <p className="text-sm">Problems Solved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-500">{user.submissions || 0}</p>
                <p className="text-sm">Submissions</p>
              </div>
            </div>
          </div>

          {/* Achievements Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🏆 Achievements</h2>
            {user.achievements?.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                {user.achievements.map((ach, i) => (
                  <li key={i}>{ach}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No achievements yet.</p>
            )}
          </div>
        </div>

        {/* Future Analytics Card */}
        <div className="mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📈 Activity</h2>
          <p className="text-gray-500 dark:text-gray-400">Feature coming soon... (submission graph, progress charts, etc.)</p>
        </div>
      </div>
    </div>
  );
}
