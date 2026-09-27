export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>AlgoVed · an online judge for C++</p>
        <a href="https://github.com/nanda2708/AlgoVed" className="hover:text-slate-300">Source on GitHub</a>
      </div>
    </footer>
  );
}
