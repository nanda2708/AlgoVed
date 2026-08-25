import axios from 'axios';

const MAX_CODE_LENGTH = 100_000;
const MAX_INPUT_LENGTH = 100_000;

const compilerRequest = async (path, payload) => {
  const baseUrl = process.env.COMPILER_API_URL?.replace(/\/$/, '');
  const key = process.env.COMPILER_API_KEY;
  if (!baseUrl || !key) {
    const error = new Error('Compiler service is not configured');
    error.status = 503;
    throw error;
  }

  return axios.post(`${baseUrl}${path}`, payload, {
    headers: { 'x-compiler-key': key },
    timeout: 15_000,
    maxContentLength: 1_000_000,
    maxBodyLength: 1_000_000,
  });
};

export const runCode = async (req, res) => {
  const { language = 'cpp', code, input = '' } = req.body || {};
  if (language !== 'cpp') return res.status(400).json({ message: 'Only C++ execution is currently supported' });
  if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ message: 'Code is required' });
  if (code.length > MAX_CODE_LENGTH) return res.status(413).json({ message: 'Code is too large' });
  if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) return res.status(413).json({ message: 'Input is too large' });

  try {
    const response = await compilerRequest('/run', { language, code, input });
    return res.json({ success: true, output: response.data?.output ?? '' });
  } catch (error) {
    const status = error.status || error.response?.status || (error.code === 'ECONNABORTED' ? 504 : 502);
    const message = error.response?.data?.error || error.message || 'Code execution failed';
    return res.status(status).json({ message });
  }
};

export const reviewCode = async (req, res) => {
  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ message: 'Code is required' });
  if (code.length > MAX_CODE_LENGTH) return res.status(413).json({ message: 'Code is too large' });

  try {
    const response = await compilerRequest('/ai-review', { code });
    return res.json({ success: true, review: response.data?.review ?? '' });
  } catch (error) {
    const status = error.status || error.response?.status || 502;
    const message = error.response?.data?.error || error.message || 'AI review failed';
    return res.status(status).json({ message });
  }
};
