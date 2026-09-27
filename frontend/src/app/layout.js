import './globals.css';
import ClientWrapper from './components/ClientWrapper';

const description = 'An online judge for C++: solve problems against hidden tests, compete in timed contests, and code together in shared rooms.';

export const metadata = {
  metadataBase: new URL('https://algoved.is-a.dev'),
  title: { default: 'AlgoVed', template: '%s · AlgoVed' },
  description,
  openGraph: { title: 'AlgoVed', description, url: 'https://algoved.is-a.dev', type: 'website' },
  twitter: { card: 'summary', title: 'AlgoVed', description },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-slate-100 antialiased">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
