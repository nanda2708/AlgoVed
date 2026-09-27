'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import api, { errorMessage } from '../../lib/api';
import { AuthCard, Field } from '../components/AuthCard';

export default function Signup() {
  const { isLoggedIn, authLoading, login } = useContext(AuthContext);
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
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
      const { data } = await api.post('/auth/signup', form);
      await login(data.token);
      router.push('/problems');
    } catch (err) {
      setError(errorMessage(err, 'Sign up failed'));
      setLoading(false);
    }
  };

  if (authLoading || isLoggedIn) return null;

  return (
    <AuthCard title="Create an account" footer={<>Already registered? <Link href="/login" className="text-blue-400 hover:underline">Log in</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" name="fullName" autoComplete="name" value={form.fullName} onChange={update} required maxLength={100} />
        <Field label="Username" name="username" autoComplete="username" value={form.username} onChange={update} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_.\-]+" hint="3–30 characters: letters, digits, _ . -" />
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} required />
        <Field label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} required minLength={8} hint="At least 8 characters" />
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{loading ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthCard>
  );
}
