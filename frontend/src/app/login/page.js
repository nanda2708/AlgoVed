'use client';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { isLoggedIn, authLoading, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!authLoading && isLoggedIn) router.push('/problems');
  }, [isLoggedIn, authLoading, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submission = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      login(res.data.token);
      router.push('/problems');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isLoggedIn) return null;

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow">
      <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Login to AlgoVed</h1>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <form onSubmit={submission} className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-black dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-black dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:bg-blue-300"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Don’t have an account?{' '}
        <a href="/signup" className="text-blue-500 hover:underline">
          Sign Up
        </a>
      </p>
    </div>
  );
}
