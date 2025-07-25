import fs from 'fs'
import path from 'path';
import { v4 as uuid } from 'uuid';
import getDirname from './getDirname.js';

const __dirname = getDirname(import.meta.url);
const dirInputs = path.join(__dirname, 'inputs');

if (!fs.existsSync(dirInputs)) {
    fs.mkdirSync(dirInputs, { recursive: true });
}

const generateInputFile = (input) => {
    if (typeof input !== 'string') {
        throw new Error('Invalid input content');
    }
    const jobId = uuid();
    const input_filename = `${jobId}.txt`;
    const input_filePath = path.join(dirInputs, input_filename);
    fs.writeFileSync(input_filePath, input || '');
    return input_filePath;
};

export default generateInputFile;