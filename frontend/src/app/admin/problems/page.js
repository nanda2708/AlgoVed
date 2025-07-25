'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

export default function AdminProblems() {
  const { isLoggedIn, authLoading, isAdmin } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    testCases: [{ input: '', output: '', hidden: false }],
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/problems`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted) {
          setProblems(res.data);
          setFilteredProblems(res.data);
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load problems');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProblems();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, authLoading, isAdmin, router]);

  useEffect(() => {
    let filtered = problems;
    if (filterDifficulty !== 'All') {
      filtered = filtered.filter(p => p.difficulty === filterDifficulty);
    }
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredProblems(filtered);
  }, [searchQuery, filterDifficulty, problems]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleFormChange = (e, index = null) => {
    if (index !== null) {
      const newTestCases = [...form.testCases];
      newTestCases[index][e.target.name] = e.target.name === 'hidden' ? e.target.checked : e.target.value;
      setForm({ ...form, testCases: newTestCases });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const addTestCase = () => {
    setForm({ ...form, testCases: [...form.testCases, { input: '', output: '', hidden: false }] });
  };

  const removeTestCase = (index) => {
    setForm({ ...form, testCases: form.testCases.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      if (editingId) {
        const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProblems(problems.map((p) => (p._id === editingId ? res.data.problem : p)));
        showToast('Problem updated successfully');
        setEditingId(null);
      } else {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/problems`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProblems([res.data.problem, ...problems]);
        showToast('Problem created successfully');
      }
      setForm({ title: '', description: '', difficulty: 'Easy', testCases: [{ input: '', output: '', hidden: false }] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save problem');
    }
  };

  const handleEdit = (problem) => {
    setForm({
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      testCases: problem.testCases || [{ input: '', output: '', hidden: false }],
    });
    setEditingId(problem._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProblems(problems.filter((p) => p._id !== id));
      showToast('Problem deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete problem');
    }
  };

  if (authLoading || loading) return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  if (!isLoggedIn) return null;
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-10 text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-500" role="alert">Admin Access Required</h1>
        <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
        <button
          onClick={() => router.push('/problems')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Problems
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-md z-50 animate-slide-down">
          {toast}
        </div>
      )}

      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">Manage Problems</h1>

      {error && (
        <p className="text-red-500 mb-6 text-center font-medium" role="alert">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-10 grid gap-6">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleFormChange}
          placeholder="Problem Title"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-black dark:text-white"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleFormChange}
          rows="4"
          placeholder="Problem Description"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-white dark:bg-gray-900 text-black dark:text-white"
          required
        />
        <select
          name="difficulty"
          value={form.difficulty}
          onChange={handleFormChange}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-black dark:text-white"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Test Cases</h3>
          {form.testCases.map((tc, i) => (
            <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-center">
              <input
                type="text"
                name="input"
                value={tc.input}
                onChange={(e) => handleFormChange(e, i)}
                placeholder="Input"
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-black dark:text-white"
                required
              />
              <input
                type="text"
                name="output"
                value={tc.output}
                onChange={(e) => handleFormChange(e, i)}
                placeholder="Output"
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-black dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => removeTestCase(i)}
                disabled={form.testCases.length === 1}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 h-[42px]"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTestCase}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Add Test Case
          </button>
        </div>

        <button type="submit" className="w-full sm:w-fit bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
          {editingId ? 'Update Problem' : 'Create Problem'}
        </button>
      </form>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          className="w-full sm:w-1/2 border px-4 py-2 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-full sm:w-fit border px-4 py-2 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white"
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
        >
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {filteredProblems.length === 0 ? (
        <p className="text-gray-500 text-center">No problems match your filters.</p>
      ) : (
        <div className="grid gap-6">
          {filteredProblems.map((problem) => (
            <div
              key={problem._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col sm:flex-row justify-between gap-4"
            >
              <div>
                <h3 className="text-xl font-bold text-blue-600 hover:underline">
                  <a href={`/problems/${problem._id}`}>{problem.title}</a>
                </h3>
                <p className="text-sm text-gray-500 mt-1">Difficulty: {problem.difficulty}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(problem)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(problem._id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}