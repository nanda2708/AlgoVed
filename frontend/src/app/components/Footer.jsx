export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm">
        <p>&copy; 2025 <span className="font-semibold text-white">AlgoVed</span>. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3 text-gray-400 text-xs">
          <a href="/about" className="hover:text-white transition">About</a>
          <a href="/contact" className="hover:text-white transition">Contact</a>
          <a href="/terms" className="hover:text-white transition">Terms</a>
        </div>
      </div>
    </footer>
  );
}
