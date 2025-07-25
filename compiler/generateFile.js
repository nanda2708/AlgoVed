import fs from 'fs'
import {v4 as uuid} from 'uuid'
import path from 'path'
import getDirname from './getDirname.js';

const __dirname = getDirname(import.meta.url);
const dirCodes = path.join(__dirname, 'codes');

if (!fs.existsSync(dirCodes)) {
    fs.mkdirSync(dirCodes, { recursive: true });
}

const generateFile = (format, content) => {
    if (!content || typeof content !== 'string') {
        throw new Error('Invalid code content');
    }
    if (format !== 'cpp') {
        throw new Error('Unsupported language');
    }
    const jobId = uuid();
    const filename = `${jobId}.${format}`;
    const filePath = path.join(dirCodes, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
};

export default generateFile;