'use client';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

export default function Signup() {
  const { isLoggedIn, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    dob: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) router.push('/problems');
  }, [isLoggedIn, router]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
        formData
      );
      login(res.data.token); // assumes backend sends { token }
      router.push('/problems');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) return null;

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow">
      <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Create an Account</h1>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="username"
          placeholder="Username (min 3 chars)"
          value={formData.username}
          onChange={handleChange}
          required
          minLength={3}
          className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-black dark:text-white"
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 chars)"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-black dark:text-white"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-black dark:text-white"
        />
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-black dark:text-white"
        />
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-black dark:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:bg-blue-300"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <a href="/login" className="text-blue-500 hover:underline">
          Login
        </a>
      </p>
    </div>
  );
}
