import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Returns the directory name (like __dirname) for an ES module file.
 * @param {string} metaUrl - Typically `import.meta.url`
 * @returns {string} - Directory path
 */
export default function getDirname(metaUrl) {
  const __filename = fileURLToPath(metaUrl);
  const __dirname = dirname(__filename);
  return __dirname;
}