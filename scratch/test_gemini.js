const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../backend/.env' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("No API key found!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContentStream('Say the exact words: "Yes, it is working perfectly!"');
    
    process.stdout.write("Stream response: ");
    for await (const chunk of result.stream) {
      process.stdout.write(chunk.text());
    }
    console.log("\nSuccess!");
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

test();
