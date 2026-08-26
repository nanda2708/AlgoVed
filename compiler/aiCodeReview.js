import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const aiCodeReview = async (code) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Analyze the following code and provide a short and concise review. Include a list of potential improvements and suggestions:\n\n${code}`;
    const result = await model.generateContent(prompt);
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('No valid text content in AI response');
    }

    return text;
  } catch (error) {
    throw new Error(`AI review failed: ${error.message}`);
  }
};

export default aiCodeReview;
