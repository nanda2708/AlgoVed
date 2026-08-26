import './globals.css';
import ClientWrapper from './components/ClientWrapper';

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
      <body className="min-h-screen font-sans dark:bg-gray-950">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
