'use client';
import { AuthProvider } from '../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ClientWrapper({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </AuthProvider>
  );
}