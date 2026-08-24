import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#0b1020] text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>© 2026 <span className="font-semibold text-slate-200">AlgoVed</span>. Built for people who like to code.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
