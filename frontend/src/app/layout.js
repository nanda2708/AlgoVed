import './globals.css';
import { Inter } from 'next/font/google';
import ClientWrapper from './components/ClientWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Online Judge - Code, Compete, Conquer',
  description: 'A SaaS platform for coding competitions, practice problems, and skill improvement.',
  openGraph: {
    title: 'Online Judge',
    description: 'Join coding competitions and improve your skills with our online judge.',
    url: 'https://yourdomain.com',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-gray-950 min-h-screen flex flex-col`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}