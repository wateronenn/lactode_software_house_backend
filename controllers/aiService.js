const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function generateAIReview(prompt,retries=2 ) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt
    });

    const text = response.text;

    return extractJSON(text) || {
      bestFor: "Travelers",
      summary: text
    };

  } catch (err) {
    if (retries > 0) {
      console.log("Retrying AI...", retries);
      await new Promise(r => setTimeout(r, 1000)); // wait 1 sec
      return generateAIReview(prompt, retries - 1);
    }
    console.error(err);
    return {
      bestFor: "Unknown",
      summary: `AI unavailable ${err.message}`
    };
  }
}

module.exports.generateAIReview = generateAIReview;