'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import ProblemFilter from '../components/ProblemFilter';
import { motion } from 'framer-motion';

export default function Problems() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const res = await axios.get(`${API_URL}/api/problems`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) setProblems(res.data);
      } catch (err) {
        if (isMounted)
          setError(err.response?.data?.message || 'Failed to load problems');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProblems();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, authLoading, router, API_URL]);

  if (authLoading || loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-lg text-gray-600 dark:text-gray-300 animate-pulse">
        ⏳ Loading Practice Problems...
      </div>
    );

  if (error)
    return (
      <div className="text-center mt-20 text-red-500 font-semibold" role="alert">
        {error}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 relative">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-10 text-gray-900 dark:text-white">
        🧠 Practice Problems
      </h1>

      {problems.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
          No problems available yet. Check back soon!
        </p>
      ) : (
        <div className="transition-opacity duration-500">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="relative h-full w-full [&>div]:absolute [&>div]:inset-0 [&>div]:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [&>div]:bg-[size:14px_24px] opacity-80">
              <div></div>
            </div>
          </div>

          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <ProblemFilter problems={problems} />
          </motion.div>
        </div>
      )}
    </div>
  );
}
