'use client';
import { useState } from 'react';
import ProblemCard from './ProblemCard';

export default function ProblemFilter({ problems }) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const tags = [...new Set(
    (problems || [])
      .flatMap((p) => Array.isArray(p.tags) ? p.tags : [])
      .filter(Boolean)
  )];

  const filteredProblems = (problems || []).filter(
    (problem) =>
      problem?.title?.toLowerCase().includes(search.toLowerCase()) &&
      (selectedTag === '' || (Array.isArray(problem.tags) && problem.tags.includes(selectedTag)))
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search problems..."
          className="w-full sm:w-1/2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="w-full sm:w-1/4 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
        >
          <option value="">All Tags</option>
          {tags.map((tag, index) => (
            <option key={`tag-${index}`} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProblems.map((problem, index) => (
          <ProblemCard key={problem._id || problem.id || index} problem={problem} />
        ))}
      </div>
    </div>
  );
}
