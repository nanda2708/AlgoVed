'use client';
import { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.js';
import MonacoCodeEditor from '../components/MonacoCodeEditor.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

const CodeRoomPage = () => {
  const { user, isLoggedIn, authLoading } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState('// Start coding here');
  const [language, setLanguage] = useState('cpp');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputError, setOutputError] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [token, setToken] = useState(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [panelWidth, setPanelWidth] = useState(70);
  const searchParams = useSearchParams();
  const router = useRouter();
  const containerRef = useRef(null);

  const roomId = searchParams.get('roomId');

  // Get token on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  // Initialize Socket.IO
  useEffect(() => {
    if (!isLoggedIn || !user || !roomId || !token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token },
      query: { userId: user.userId, username: user.username },
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected, userId:', user.userId);
      newSocket.emit('joinRoom', { roomId, userId: user.userId, username: user.username });
    });

    newSocket.on('roomJoined', (data) => {
      console.log('Room joined:', data);
      setCode(data.code);
      setLanguage(data.language);
      setInput(data.input);
      setUsers(data.users);
    });

    newSocket.on('userJoined', (data) => {
      console.log('User joined:', data);
      setUsers((prev) => [...new Set([...prev, data.userId])]);
    });

    newSocket.on('codeUpdate', (data) => {
      console.log('Code update received:', data);
      setCode(data.code);
      setLanguage(data.language);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setError('Failed to connect to server');
    });

    return () => {
      newSocket.disconnect();
      console.log('Socket disconnected');
    };
  }, [roomId, token, user, isLoggedIn]);

  // Fetch room details
  useEffect(() => {
    if (!isLoggedIn || !roomId || !token) return;

    const fetchRoom = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/coding-room/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Room fetched:', response.data);
        setCode(response.data.code);
        setLanguage(response.data.language);
        setInput(response.data.input);
        setUsers(response.data.users);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch room');
        console.error('Fetch room error:', err);
      }
    };
    fetchRoom();
  }, [roomId, token, isLoggedIn]);

  // Force editor re-render for semantic highlighting
  useEffect(() => {
    const timer = setTimeout(() => {
      setLanguage((prev) => prev);
      if (window.monaco) {
        window.monaco.editor.getModels().forEach((model) => {
          window.monaco.editor.setModelLanguage(model, language);
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [language]);

  // Handle code changes
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket) {
      socket.emit('codeUpdate', { roomId, code: newCode, language });
      console.log('Emitted codeUpdate:', { roomId, code: newCode, language });
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (socket) {
      socket.emit('codeUpdate', { roomId, code, language: newLanguage });
      console.log('Emitted codeUpdate:', { roomId, code, language: newLanguage });
    }
  };

  // Run code
  const handleRunCode = async () => {
    setError('');
    setOutput('');
    setOutputError('');
    setLoadingRun(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_COMPILER_API_URL}/run`,
        { language, code, input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Run code response:', response.data);
      setOutput(response.data.output || '');
      setOutputError(response.data.error || '');
    } catch (err) {
      console.error('Run code error:', err);
      setOutputError(err.response?.data?.error || 'Failed to run code');
    } finally {
      setLoadingRun(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-300 bg-gradient-to-br from-slate-900 to-slate-800">
        <FaSpinner className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!isLoggedIn || !roomId) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 font-sans text-slate-200" ref={containerRef}>
      <div className="flex h-full w-full p-4">
        {/* Left Panel: Code Editor */}
        <motion.div
          className="flex flex-col h-full bg-slate-800 rounded-lg shadow-lg"
          style={{ width: `${panelWidth}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <h2 className="text-xl font-semibold p-4 text-white">Code Editor</h2>
          <div className="flex-1 rounded-lg overflow-hidden border border-slate-700 m-4">
            <MonacoCodeEditor
              code={code}
              setCode={handleCodeChange}
              language={language}
              setLanguage={handleLanguageChange}
              height="100%"
            />
          </div>
          <div className="flex justify-end gap-2 p-4">
            <motion.button
              onClick={handleRunCode}
              disabled={loadingRun}
              className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 disabled:bg-green-300 transition-colors duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loadingRun && <FaSpinner className="animate-spin" />}
              Run Code
            </motion.button>
          </div>
        </motion.div>

        {/* Right Panel: Input/Output */}
        <div className="flex flex-col h-full" style={{ width: `${100 - panelWidth}%` }}>
          <div className="flex justify-end gap-2 p-2 bg-slate-700 border-b border-slate-600">
            <motion.button
              onClick={() => setPanelWidth(Math.max(30, panelWidth - 10))}
              className="px-3 py-1 text-xs bg-slate-600 text-slate-200 rounded hover:bg-slate-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Expand Editor
            </motion.button>
            <motion.button
              onClick={() => setPanelWidth(Math.min(90, panelWidth + 10))}
              className="px-3 py-1 text-xs bg-slate-600 text-slate-200 rounded hover:bg-slate-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Expand Input/Output →
            </motion.button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-white">Input</h2>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-1/3 bg-slate-800 text-slate-200 border-slate-600 border p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm mb-4"
              placeholder="Enter custom input..."
              aria-label="Custom Input"
            />
            <h2 className="text-xl font-semibold mb-4 text-white">Output</h2>
            <div className="w-full h-1/3 bg-slate-800 text-slate-200 border-slate-600 border p-4 rounded-lg overflow-auto font-mono text-sm">
              {outputError && (
                <motion.p
                  className="text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {outputError}
                </motion.p>
              )}
              {output && (
                <motion.pre
                  className="text-slate-200 whitespace-pre-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {output}
                </motion.pre>
              )}
              {!output && !outputError && (
                <p className="text-slate-400">Run code to see output...</p>
              )}
            </div>
          </div>
        </div>

        {/* Header: Room Info and Users */}
        <motion.div
          className="absolute top-0 left-0 w-full bg-slate-900 p-4 shadow-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-white">Code Room: {roomId}</h1>
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-red-400 bg-red-900/50 p-2 rounded mt-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                role="alert"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-sm mt-2">
            <span className="font-semibold text-white">Users in room:</span> {users.join(', ')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CodeRoomPage;