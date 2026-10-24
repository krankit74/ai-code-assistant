require("dotenv").config();
const connectDB = require("./config/db");

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const authRoutes = require("./routes/auth");
const savedResponseRoutes = require("./routes/savedResponses");

const app = express();

const PORT = 3000;

// ========================================
// Gemini AI Client
// ========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateAIResponse(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}`);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.log(`Gemini attempt ${attempt} failed`);

      if (attempt === 3) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
    }
  }
}

// ========================================
// Middleware
// ========================================

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/saved-responses", savedResponseRoutes);

// ========================================
// Test API
// ========================================

app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
  });
});

// ========================================
// AI Code Explanation API
// ========================================

app.post("/api/explain", async (req, res) => {
  try {
    const code = req.body.code;
    const language = req.body.language;

    console.log("Received code:");
    console.log(code);

    // Prompt sent to Gemini
    const prompt = `
You are an intelligent coding assistant.

Analyze the following ${language} code.

Give a concise and natural response, similar to ChatGPT.

Rules:
- Keep the answer short and useful.
- Don't unnecessarily repeat the code.
- Use simple language.
- Adapt the explanation to the complexity of the code.
- For simple code, answer in 3-5 lines.
- For complex code, provide more detail.
- Use headings and bullet points when helpful.
- Always mention time and space complexity when applicable.

Code:
${code}
`;

    // Send prompt to Gemini
    const explanation = await generateAIResponse(prompt);

    console.log("AI response received");

    res.json({
      explanation: explanation,
    });
  } catch (error) {
    console.error("AI ERROR:", error);

    res.status(500).json({
      error: "Something went wrong while communicating with Gemini.",
    });
  }
});

app.post("/api/debug", async (req, res) => {
  try {
    const code = req.body.code;
    const language = req.body.language;

    console.log("Received code for debugging:");
    console.log(code);

    const prompt = `
You are an expert coding assistant.

Debug the following ${language} code.

Respond naturally and concisely.

If the code is correct, clearly say:
"✅ No major issues found."

If there is a problem, provide:

1. ❌ Problem
2. Why it happens
3. ✅ Fix
4. Corrected code

Rules:
- Don't give unnecessary explanations.
- Don't repeat the entire input code unless needed.
- Focus on the actual problem.
- Keep simple bugs very short.
- For complex bugs, explain the important reasoning.

Code:
${code}
`;

    const debugResult = await generateAIResponse(prompt);

    console.log("AI debug response received");

    res.json({
      debug: debugResult,
    });
  } catch (error) {
    console.error("DEBUG AI ERROR:", error);

    res.status(500).json({
      error: "Something went wrong while debugging the code.",
    });
  }
});

app.post("/api/optimize", async (req, res) => {
  try {
    const code = req.body.code;
    const language = req.body.language;

    console.log("Received code for optimization:");
    console.log(code);

    const prompt = `
You are an expert software engineer.

Review the following ${language} code and suggest improvements.

Respond concisely and naturally.

Include only what is useful:

- What can be improved
- Why it should be improved
- Current complexity
- Improved complexity
- Optimized code

Rules:
- Don't optimize code unnecessarily.
- If the code is already good, say so.
- Prefer practical improvements.
- Avoid long explanations.

Code:
${code}
`;

    const optimization = await generateAIResponse(prompt);

    console.log("AI optimization response received");

    res.json({
      optimization: optimization,
    });
  } catch (error) {
    console.error("OPTIMIZE AI ERROR:", error);

    res.status(500).json({
      error: "Something went wrong while optimizing the code.",
    });
  }
});

// ========================================
// Start Server
// ========================================

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
