import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const aiCodeReview = async (code) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Analyze the following code and provide a short and concise review. Include a list of potential improvements and suggestions:\n\n${code}`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) {
            return 'No valid text content in AI response';
        }
        return text;
        } catch (error) {
        throw new Error(`AI review failed: ${error.message}`);
    }
};

export default aiCodeReview;