import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import getDirname from './getDirname.js';

const __dirname = getDirname(import.meta.url);
const outputPath = path.join(__dirname, 'outputs');

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const ROOT_DIR = path.resolve(__dirname);

const sanitizePath = (filePath) => {
  const resolvedPath = path.resolve(filePath);
  const relative = path.relative(ROOT_DIR, resolvedPath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid file path');
  }

  return resolvedPath;
};

const executeCpp = (filepath, inputPath) => {
  const safeFilePath = sanitizePath(filepath);
  const safeInputPath = sanitizePath(inputPath);
  const jobId = path.basename(safeFilePath, path.extname(safeFilePath));
  const isWindows = process.platform === 'win32';
  const executableExt = isWindows ? '.exe' : '.out';
  const executablePath = path.join(outputPath, `${jobId}${executableExt}`);
  const executableCommand = isWindows ? `"${executablePath}"` : `"${executablePath}"`;

  const compileCommand = `g++ "${safeFilePath}" -std=c++17 -O2 -pipe -o "${executablePath}"`;
  const runCommand = `${executableCommand} < "${safeInputPath}"`;

  const execCommand = (command, timeout) => new Promise((resolve, reject) => {
    exec(
      command,
      {
        timeout,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          const message = error.killed
            ? 'Program execution timed out'
            : stderr?.trim() || error.message;
          reject(new Error(message));
          return;
        }

        if (stderr?.trim()) {
          reject(new Error(stderr.trim()));
          return;
        }

        resolve(stdout);
      },
    );
  });

  return (async () => {
    try {
      await execCommand(compileCommand, 10000);
      return await execCommand(runCommand, 3000);
    } finally {
      try {
        if (fs.existsSync(executablePath)) fs.rmSync(executablePath, { force: true });
      } catch (cleanupError) {
        console.warn('Failed to clean compiled executable:', cleanupError.message);
      }
    }
  })();
};

export default executeCpp;
