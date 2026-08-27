import './globals.css';
import ClientWrapper from './components/ClientWrapper';

export const metadata = {
  metadataBase: new URL('https://algoved.is-a.dev'),
  title: 'AlgoVed - Collaborative Coding & C++ Development',
  description:
    'AlgoVed is a developer workspace for running C++ code, real-time collaborative coding, automated judging, and AI-assisted code review.',
  openGraph: {
    title: 'AlgoVed',
    description:
      'Write, run, review, and collaborate on code with AlgoVed.',
    url: 'https://algoved.is-a.dev',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'AlgoVed',
    description:
      'Write, run, review, and collaborate on code with AlgoVed.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans dark:bg-gray-950">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
