'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import api, { errorMessage } from '../../lib/api';
import { AuthCard, Field } from '../components/AuthCard';

export default function Login() {
  const { isLoggedIn, authLoading, login } = useContext(AuthContext);
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isLoggedIn) router.replace('/problems');
  }, [isLoggedIn, authLoading, router]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      await login(data.token);
      router.push('/problems');
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
      setLoading(false);
    }
  };

  if (authLoading || isLoggedIn) return null;

  return (
    <AuthCard title="Log in" footer={<>New here? <Link href="/signup" className="text-blue-400 hover:underline">Create an account</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Username or email" name="username" autoComplete="username" value={form.username} onChange={update} required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={update} required />
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{loading ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthCard>
  );
}
