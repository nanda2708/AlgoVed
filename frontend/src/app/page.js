'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-0">
        <div className="relative h-full w-full [&>div]:absolute [&>div]:inset-0 [&>div]:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [&>div]:bg-[size:14px_24px]">
          <div></div>
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
          Welcome to <span className="text-sky-400">Online Judge</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 animate-fade-in-delay">
          Master coding through competitive programming, real-time battles, and tailored problem-solving practice.
        </p>
        <Link href="/problems">
          <button className="bg-sky-400 hover:bg-sky-300 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-md">
            Start Coding
          </button>
        </Link>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 animate-slide-up">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-2xl font-semibold text-sky-400 mb-2">Compete</h2>
            <p className="text-slate-300">Join real-time coding contests with your friends and rivals.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-2xl font-semibold text-sky-400 mb-2">Practice</h2>
            <p className="text-slate-300">Solve curated problems, test with edge cases, and sharpen your skills.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h2 className="text-2xl font-semibold text-sky-400 mb-2">Track</h2>
            <p className="text-slate-300">Visualize your streaks, achievements, and growth over time.</p>
          </div>
        </section>

        {/* About & Acknowledgements */}
        {/* <section className="mt-20 max-w-3xl mx-auto text-center animate-fade-in-delay">
          <h3 className="text-3xl font-bold mb-4">About this Project</h3>
          <p className="text-slate-400">
            This platform was built as part of the SWE Co-Op Internship at <span className="text-white font-medium">AlgoUniversity</span>.
            I sincerely thank my mentors for their invaluable guidance, feedback, and constant support throughout this journey.
          </p>

          <div className="flex justify-center gap-8 mt-10">
            {[
              { name: 'Bhavesh Garg', img: '/mentors/bhavesh.jpg' },
              { name: 'Kanti Kiran', img: '/mentors/kanti.jpg' },
              { name: 'Ashutosh Shrivastav', img: '/mentors/shutosh.jpg' },
            ].map((mentor) => (
              <div key={mentor.name} className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-sky-400 shadow-md">
                  <Image
                    src={mentor.img}
                    alt={mentor.name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                <p className="mt-2 text-slate-200 text-sm">{mentor.name}</p>
              </div>
            ))}
          </div>
        </section> */}
      </main>

      {/* Animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }
        .animate-fade-in-delay {
          animation: fadeIn 1.6s ease-in-out;
        }
        .animate-slide-up {
          animation: slideUp 1.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
