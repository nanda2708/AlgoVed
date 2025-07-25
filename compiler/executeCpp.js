import {exec} from 'child_process'
import fs from 'fs'
import path from 'path'
import getDirname from './getDirname.js';

const __dirname = getDirname(import.meta.url);
const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const sanitizePath = (filePath) => {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(__dirname))) {
        throw new Error("Invalid file path");
    }
    return resolvedPath;
};

const executeCpp = (filepath, inputPath) => {
    const jobId = path.basename(filepath).split(".")[0];
    const isWindows = process.platform === 'win32';
    const executableExt = isWindows ? '.exe' : '.out';
    const executableName = isWindows ? `${jobId}.exe` : `./${jobId}.out`;
    const outPath = path.join(outputPath, `${jobId}${executableExt}`);

    // Sanitize paths
    const safeFilePath = sanitizePath(filepath);
    const safeInputPath = sanitizePath(inputPath);

    /*
    🔐 Advantages:
        Sanitizes paths

        const sanitizePath = (filePath) => {
            const resolvedPath = path.resolve(filePath);
            if (!resolvedPath.startsWith(path.resolve(__dirname))) {
                throw new Error("Invalid file path");
            }
            return resolvedPath;
        };
        Prevents directory traversal attacks.

        Ensures that the filepath and inputPath stay within your project directory.

        Uses path.resolve() to normalize file paths and make sure they're absolute.

        Wraps paths in double quotes in the exec() command:

        exec(
            `g++ "${safeFilePath}" -o "${outPath}" && cd "${outputPath}" && ./${jobId}.out < "${safeInputPath}"`,
        This prevents issues with paths that contain spaces or special characters.
    */

    const command = `g++ "${safeFilePath}" -o "${outPath}" && cd "${outputPath}" && ${executableName} < "${safeInputPath}"`;

    return new Promise((resolve, reject) => {
        exec(command,(error, stdout, stderr) => {
                if (error || stderr) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout);
                }
            }
        );
    });
};

export default executeCpp;