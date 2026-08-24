'use client';

import Link from 'next/link';

const features = [
  {
    title: 'Practice',
    text: 'Work through problems at your own pace with clear statements, examples, and submissions.',
    href: '/problems',
  },
  {
    title: 'Compete',
    text: 'Take part in contests, compare scores, and see how you stack up on the leaderboard.',
    href: '/compete',
  },
  {
    title: 'Code together',
    text: 'Open a room and solve problems with other people in real time.',
    href: '/rooms',
  },
];

export default function Home() {
  return (
    <div className="bg-coding-dark">
      <section className="border-b border-slate-800">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">Competitive programming, without the clutter</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn algorithms. Write code. Get better.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              AlgoVed gives you one practical place to practice programming problems, enter contests, run C++ code, and work with other developers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/problems" className="rounded-md bg-blue-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-400">
                Browse problems
              </Link>
              <Link href="/compiler" className="rounded-md border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900">
                Open compiler
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">AlgoVed</p>
                <p className="mt-1 font-semibold text-white">A focused coding workspace</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400">Ready to code</span>
            </div>
            <div className="space-y-3 py-5 font-mono text-sm">
              <div className="rounded-md bg-slate-950 px-4 py-3 text-slate-300">01&nbsp;&nbsp; #include &lt;iostream&gt;</div>
              <div className="rounded-md bg-slate-950 px-4 py-3 text-slate-300">02&nbsp;&nbsp; int main() {'{'}</div>
              <div className="rounded-md bg-slate-950 px-4 py-3 text-slate-300">03&nbsp;&nbsp;&nbsp;&nbsp; cout &lt;&lt; "Hello, AlgoVed";</div>
              <div className="rounded-md bg-slate-950 px-4 py-3 text-slate-300">04&nbsp;&nbsp; {'}'}</div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
              <span>C++</span>
              <span>Compile &amp; run</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-400">Everything you need</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Practice the way you actually code.</h2>
          <p className="mt-3 text-slate-400">No unnecessary dashboards or decorative clutter. Just the tools you need to solve and improve.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} className="group rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-[950]">
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
              <span className="mt-5 inline-block text-sm font-medium text-blue-400 group-hover:text-blue-300">Explore →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
