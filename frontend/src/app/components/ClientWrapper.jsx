'use client';

import { AuthProvider } from '../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ClientWrapper({ children }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
