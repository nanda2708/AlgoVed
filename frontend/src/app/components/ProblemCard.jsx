import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ProblemCard({ problem }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
    >
      {/* Card Content */}
      <Link href={`/problems/${problem._id}`} className="block">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow hover:shadow-xl transition duration-300 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{problem.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Difficulty: <span className={`font-medium ${problem.difficulty === 'Hard' ? 'text-red-500' : problem.difficulty === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>{problem.difficulty}</span></p>
          <div className="flex flex-wrap gap-2 mt-3">
            {problem.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>

  );
}
