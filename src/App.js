import React, { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

  // 🟢 Handle GPT-4 Estimate Request
  const handleEstimate = async () => {
    if (!input.trim()) return;

    try {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: `Estimate this job: ${input}. Include labor, materials, and total cost.` }],
        }),
      });

      const data = await aiResponse.json();
      if (data.choices && data.choices.length > 0) {
        setResponse(data.choices[0].message.content);
      } else {
        setResponse("Error: No response from AI.");
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setResponse("Error generating estimate. Please try again.");
    }
  };

  // 🟢 Handle Voice Input via Whisper API
  const handleVoiceInput = async () => {
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.wav");
          formData.append("model", "whisper-1");

          try {
            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
              method: "POST",
              headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
              body: formData,
            });

            const data = await response.json();
            if (data.text) {
              setInput(data.text); // Convert speech-to-text and set as input
            } else {
              setResponse("Error: No transcription available.");
            }
          } catch (error) {
            console.error("Error fetching transcription:", error);
            setResponse("Error processing voice input. Please try again.");
          }
        };
      }, 5000); // Record for 5 seconds
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
      setResponse("Microphone access denied.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>AI Estimating Dashboard</h1>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your project" />
      <button onClick={handleEstimate}>Estimate</button>
      <button onClick={handleVoiceInput}>{isRecording ? "Recording..." : "Use Voice"}</button>
      <p>{response}</p>
    </div>
  );
}

