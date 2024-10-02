import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import languages from "../data/language";

const PronunciationChecker = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [targetWord, setTargetWord] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[2]); // Default to English
  const recognition = useRef(null);
  const targetWordRef = useRef("");

  useEffect(() => {
    targetWordRef.current = targetWord;
  }, [targetWord]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Speech recognition is not supported in this browser.");
    } else {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = selectedLanguage.code;

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setTranscription(transcript);
        checkPronunciation(transcript);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setError(`Speech recognition error: ${event.error}. Please try again.`);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
  }, [selectedLanguage]);

  const checkPronunciation = useCallback(
    async (transcript) => {
      setIsLoading(true);
      try {
        const currentTargetWord = targetWordRef.current;
        console.log(
          `targetWord: ${currentTargetWord}, Transcript: ${transcript}`
        );
        if (!currentTargetWord) {
          setError("Please enter a target word before speaking.");
          setIsLoading(false);
          return;
        }
        console.log(
          `Before API call - targetWord: ${targetWordRef.current}, Transcript: ${transcript}`
        );
        const response = await axios.post(
          "http://localhost:9966/api/check-pronunciation",
          {
            targetWord: currentTargetWord.toLowerCase(),
            spokenWord: transcript,
            language: selectedLanguage.name,
          }
        );
        setFeedback(response.data);
      } catch (error) {
        console.error("Error checking pronunciation:", error);
        setFeedback({
          isCorrect: false,
          feedback: "Error checking pronunciation. Please try again.",
        });
      }
      setIsLoading(false);
    },
    [selectedLanguage]
  );

  const startListening = async () => {
    setError(null);
    setIsLoading(true);

    if (!targetWordRef.current) {
      setError("Please enter a target word before starting.");
      setIsLoading(false);
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.current.start();
      setIsListening(true);
    } catch (err) {
      setError(
        `Microphone access error: ${err.message}. Please check your browser settings.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">VocaLingo</h1>
      <div className="w-full max-w-md mb-4">
        <select
          value={selectedLanguage.code}
          onChange={(e) =>
            setSelectedLanguage(
              languages.find((lang) => lang.code === e.target.value)
            )
          }
          className="w-full px-4 py-2 border border-gray-300 rounded"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={targetWord}
        onChange={(e) => setTargetWord(e.target.value)}
        placeholder={`Enter word to practice in ${selectedLanguage.name}`}
        className="w-full max-w-md px-4 py-2 mb-4 border border-gray-300 rounded"
      />
      <button
        onClick={startListening}
        disabled={isListening || !targetWord || isLoading}
        className={`px-6 py-3 rounded-full text-white font-semibold ${
          isListening || !targetWord || isLoading
            ? "bg-gray-400"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isListening
          ? "Listening..."
          : isLoading
          ? "Processing..."
          : "Start Speaking"}
      </button>
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {transcription && (
        <div className="mt-8 p-4 bg-white rounded shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">You said:</h2>
          <p>{transcription}</p>
        </div>
      )}
      {feedback && (
        <div
          className={`mt-4 p-4 bg-white rounded shadow-md w-full max-w-md ${
            feedback.isCorrect
              ? "border-green-500 border-2"
              : "border-yellow-500 border-2"
          }`}
        >
          <h2 className="text-xl font-semibold mb-2">Feedback:</h2>
          <p>{feedback.feedback}</p>
          {feedback.targetPhonetic && (
            <p className="mt-2">
              <strong>Target Pronunciation:</strong> {feedback.targetPhonetic}
            </p>
          )}
          {feedback.spokenPhonetic && (
            <p className="mt-2">
              <strong>Your Pronunciation:</strong> {feedback.spokenPhonetic}
            </p>
          )}
          {feedback.commonMistakes && (
            <p className="mt-2">
              <strong>Common Mistakes:</strong> {feedback.commonMistakes}
            </p>
          )}
          {feedback.culturalContext && (
            <p className="mt-2">
              <strong>Cultural Context:</strong> {feedback.culturalContext}
            </p>
          )}
          {feedback.tips && feedback.tips.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-4 mb-2">
                Tips for improvement:
              </h3>
              <ul className="list-disc pl-5">
                {feedback.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </>
          )}
          {feedback.encouragement && (
            <p className="mt-4 font-semibold text-green-600">
              {feedback.encouragement}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PronunciationChecker;
