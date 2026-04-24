

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

async function generateAIReview(prompt, retries = 2) {
  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen3-4B-Instruct-2507:nscale", // safer than fastest tag
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3, // reduce randomness → better JSON
        }),
      }
    );

    const result = await response.json();
    console.log(result)

    // ✅ Extract text properly
    const text = result?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Empty response from HuggingFace");
    }

    // ✅ Try parsing JSON
    return extractJSON(text) || {
      bestFor: "Travelers",
      summary: text,
    };

  } catch (err) {
    if (retries > 0) {
      console.log("Retrying HF...", retries);
      await new Promise((r) => setTimeout(r, 1500));
      return generateAIReview(prompt, retries - 1);
    }

    return {
      bestFor: "Unknown",
      summary: `AI unavailable ${err.message}`,
    };
  }
}

module.exports.generateAIReview = generateAIReview;