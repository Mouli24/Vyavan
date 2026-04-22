import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, "v1");
  try {
    console.log("Testing with API version v1...");
    const suspects = ["gemini-1.5-flash", "gemini-pro"];
    for (const name of suspects) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent("test");
        console.log(`✅ ${name} works!`);
      } catch (e) {
        console.log(`❌ ${name} failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error("General error:", err.message);
  }
}

listModels();
