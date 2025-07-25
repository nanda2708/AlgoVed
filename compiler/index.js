import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import generateFile from './generateFile.js'
import generateInputFile from './generateInputFile.js'
import executeCpp from './executeCpp.js'
import aiCodeReview from './aiCodeReview.js'

const app = express();
dotenv.config();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ online: 'compiler' });
});

app.post("/run", async (req, res) => {
    const { language = 'cpp', code, input = '' } = req.body;
    if (!code) {
        return res.status(400).json({ success: false, error: "Empty code!" });
    }
    try {
        const filePath = await generateFile(language, code);
        const inputPath = await generateInputFile(input);
        const output = await executeCpp(filePath, inputPath);
        res.json({ filePath, inputPath, output });
    } catch (error) {
        res.status(500).json({ error: `Execution error: ${error.message}` });
    }
});

app.post("/ai-review", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: "Empty code!" });
  }

  try {
    const review = await aiCodeReview(code);
    console.log("AI Review Success:", review);
    res.json({ review });
  } catch (error) {
    console.error("AI Review Error:", error);
    res.status(500).json({ error: error.message || "AI Review Failed" });
  }
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Compiler server listening on port ${PORT}!`);
});