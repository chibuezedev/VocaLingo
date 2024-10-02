const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post("/api/check-pronunciation", async (req, res) => {
  try {
    const { targetWord, spokenWord, language } = req.body;

    if (!targetWord || !spokenWord || !language) {
      return res.status(400).json({
        error: "Target word, spoken word, and language are all required",
      });
    }

    // Process using Google's Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `As a multilingual pronunciation expert, evaluate the pronunciation of "${spokenWord}" compared to the target word "${targetWord}" in ${language}. 

Provide a comprehensive analysis including:

1. Correctness: Determine if the pronunciation is correct or not.
2. Phonetic Transcription: Provide the IPA (International Phonetic Alphabet) transcription for both the target word and the spoken attempt.
3. Detailed Feedback: 
   - Identify specific sounds or syllables that were pronounced correctly or incorrectly.
   - Explain any differences between the target and spoken pronunciations.
   - Describe the correct mouth positioning, tongue placement, and airflow for challenging sounds.
4. Common Mistakes: Mention typical errors made by learners of ${language} when pronouncing this word or similar sounds.
5. Cultural Context: If relevant, provide any cultural nuances or contexts related to the pronunciation or usage of the word.
6. Improvement Tips: Offer 3-5 practical exercises or techniques to help the learner improve their pronunciation.
7. Encouragement: Include a motivational message to encourage the learner's progress.

Format your response as JSON with the following structure:
{
  "isCorrect": boolean,
  "targetPhonetic": "IPA transcription of target word",
  "spokenPhonetic": "IPA transcription of spoken attempt",
  "feedback": "Detailed feedback string",
  "commonMistakes": "Description of common mistakes",
  "culturalContext": "Cultural information if applicable, or null if not",
  "tips": ["array", "of", "improvement", "tips"],
  "encouragement": "Motivational message"
}

Ensure all text is appropriate for language learners and avoid using technical linguistic terminology without explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let feedbackText = response.text();

    console.log("Raw API response:", feedbackText);

    // Clean up the response
    feedbackText = feedbackText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // console.log("Cleaned response:", feedbackText);

    // Parse the JSON response
    let feedbackJson;
    try {
      feedbackJson = JSON.parse(feedbackText);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return res.status(500).json({ error: "Error parsing API response" });
    }

    // console.log("Parsed feedback:", feedbackJson);

    res.json(feedbackJson);
  } catch (error) {
    console.error("Error processing pronunciation check:", error);
    res.status(500).json({ error: "Error processing pronunciation check" });
  }
});

const PORT = process.env.PORT || 9966;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
