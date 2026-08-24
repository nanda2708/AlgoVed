import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import getDirname from './getDirname.js';

const __dirname = getDirname(import.meta.url);
const outputPath = path.join(__dirname, 'outputs');

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const ROOT_DIR = path.resolve(__dirname);
const MAX_OUTPUT = 1024 * 1024;

const sanitizePath = (filePath) => {
  const resolvedPath = path.resolve(filePath);
  const relative = path.relative(ROOT_DIR, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid file path');
  }
  return resolvedPath;
};

const runProcess = (command, args, { timeout, cwd, inputPath = null } = {}) => new Promise((resolve, reject) => {
  const child = execFile(command, args, {
    cwd,
    timeout,
    windowsHide: true,
    maxBuffer: MAX_OUTPUT,
    shell: false,
    env: {
      PATH: process.env.PATH,
      ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot || 'C:\\Windows' } : {}),
    },
  }, (error, stdout, stderr) => {
    if (error) {
      const timedOut = error.killed || error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT';
      reject(new Error(timedOut ? 'Program execution timed out' : (stderr?.trim() || error.message)));
      return;
    }
    if (stderr?.trim()) {
      reject(new Error(stderr.trim()));
      return;
    }
    resolve(stdout || '');
  });

  if (inputPath) {
    const input = fs.createReadStream(inputPath);
    input.on('error', (error) => child.kill());
    input.pipe(child.stdin);
  }
});

const executeCpp = (filepath, inputPath) => {
  const safeFilePath = sanitizePath(filepath);
  const safeInputPath = sanitizePath(inputPath);
  const jobId = path.basename(safeFilePath, path.extname(safeFilePath));
  const isWindows = process.platform === 'win32';
  const executableExt = isWindows ? '.exe' : '.out';
  const executablePath = path.join(outputPath, `${jobId}${executableExt}`);

  return (async () => {
    try {
      await runProcess('g++', [safeFilePath, '-std=c++17', '-O2', '-pipe', '-o', executablePath], {
        timeout: 10000,
        cwd: ROOT_DIR,
      });

      return await runProcess(executablePath, [], {
        timeout: 3000,
        cwd: ROOT_DIR,
        inputPath: safeInputPath,
      });
    } finally {
      for (const artifact of [safeFilePath, safeInputPath, executablePath]) {
        try {
          if (fs.existsSync(artifact)) fs.rmSync(artifact, { force: true });
        } catch (cleanupError) {
          console.warn(`Failed to clean compiler artifact ${artifact}:`, cleanupError.message);
        }
      }
    }
  })();
};

export default executeCpp;
