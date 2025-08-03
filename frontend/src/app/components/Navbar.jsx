'use client';
import Link from 'next/link';
import { useContext, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { isLoggedIn, logout, isAdmin } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-gray-900 text-white py-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-blue-400 hover:text-blue-300 transition">
          AlgoVed
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/problems" className="hover:text-blue-300 transition">Problems</Link>
          <Link href="/compiler" className="hover:text-blue-300 transition">Compiler</Link>
          <Link href="/compete" className="hover:text-blue-300 transition">Compete</Link>
          <Link href="/rooms" className="hover:text-blue-300 transition">Rooms</Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin/problems" className="text-yellow-400 flex hover:text-yellow-300 transition">
                  Admin
                </Link>
              )}
              {/* Profile Button */}
              <div
                onClick={() => router.push('/profile')}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer font-semibold text-white select-none"
              >
                U
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 transition duration-200 shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-300 transition">Login</Link>
              <Link href="/signup" className="hover:text-blue-300 transition">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Wrap Navbar in Suspense for useRouter
export default function NavbarWrapper() {
  return (
    <Suspense fallback={
      <div className="bg-gray-900 text-white py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400">Loading Navbar...</div>
      </div>
    }>
      <Navbar />
    </Suspense>
  );
}