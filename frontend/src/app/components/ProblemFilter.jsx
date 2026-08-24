'use client';

import { useMemo, useState } from 'react';
import ProblemCard from './ProblemCard';

export default function ProblemFilter({ problems }) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const tags = useMemo(() => [...new Set(
    (problems || []).flatMap((problem) => Array.isArray(problem?.tags) ? problem.tags : []).filter(Boolean)
  )].sort(), [problems]);

  const filteredProblems = useMemo(() => (problems || []).filter((problem) => {
    const title = String(problem?.title || '').toLowerCase();
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || title.includes(query);
    const matchesTag = !selectedTag || (Array.isArray(problem?.tags) && problem.tags.includes(selectedTag));
    const matchesDifficulty = !selectedDifficulty || problem?.difficulty === selectedDifficulty;
    return matchesSearch && matchesTag && matchesDifficulty;
  }), [problems, search, selectedTag, selectedDifficulty]);

  return (
    <div className="w-full">
      <div className="mb-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Search</span>
          <input
            type="search"
            placeholder="Search by problem title"
            aria-label="Search problems"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Difficulty</span>
          <select value={selectedDifficulty} onChange={(event) => setSelectedDifficulty(event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">All difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Topic</span>
          <select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">All topics</option>
            {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{filteredProblems.length} {filteredProblems.length === 1 ? 'problem' : 'problems'}</p>
        {(search || selectedTag || selectedDifficulty) && (
          <button type="button" onClick={() => { setSearch(''); setSelectedTag(''); setSelectedDifficulty(''); }} className="text-sm font-medium text-blue-400 hover:text-blue-300">Clear filters</button>
        )}
      </div>

      {filteredProblems.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="font-medium text-white">No matching problems</p>
          <p className="mt-1 text-sm text-slate-400">Try a different search or remove one of the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProblems.map((problem, index) => <ProblemCard key={problem?._id || problem?.id || index} problem={problem} />)}
        </div>
      )}
    </div>
  );
}
