'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

const links = [
  { href: '/problems', label: 'Problems' },
  { href: '/compiler', label: 'Compiler' },
  { href: '/compete', label: 'Contests' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/rooms', label: 'Rooms' },
];

export default function Navbar() {
  const { isLoggedIn, logout, isAdmin, user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const initial = (user?.username || user?.fullName || 'U').charAt(0).toUpperCase();

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b1020]/98">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <Link href="/" onClick={closeMenu} className="shrink-0 text-xl font-bold tracking-tight text-white">
          Algo<span className="text-blue-400">Ved</span>
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 md:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <div
          id="main-navigation"
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 max-h-[calc(100vh-4rem)] overflow-y-auto flex-col border-b border-slate-800 bg-[#0b1020] px-4 py-3 md:static md:flex md:max-h-none md:flex-row md:items-center md:overflow-visible md:border-0 md:bg-transparent md:p-0`}
        >
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu} className="rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3 md:ml-5 md:mt-0 md:flex-row md:items-center md:border-0 md:pt-0">
            {isLoggedIn ? (
              <>
                {isAdmin && <Link href="/admin/problems" onClick={closeMenu} className="rounded-md px-3 py-2 text-sm text-amber-300 hover:bg-slate-800">Admin</Link>}
                <Link href="/profile" onClick={closeMenu} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-800">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">{initial}</span>
                  <span className="max-w-32 truncate text-sm text-slate-200">{user?.username || 'Profile'}</span>
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-red-400 hover:text-red-300">Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Log in</Link>
                <Link href="/signup" onClick={closeMenu} className="rounded-md bg-blue-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-400">Create account</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
