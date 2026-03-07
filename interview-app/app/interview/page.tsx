"use client";

import { useEffect, useRef, useState } from "react";

export default function InterviewPage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState("Loading interview question...");
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState<
    { question: string; answer: string }[]
  >([]);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("default");
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);

  const answerRef = useRef<HTMLTextAreaElement>(null);

  const voiceImages: Record<string, string> = {
    default: "/images/interviewer.png",
    Matthew: "/images/interviewer.png",
    Joanna: "/images/interviewer.png",
    Brian: "/images/interviewer.png",
    Amy: "/images/interviewer.png",
  };

  /* ------------------ LOAD VOICES ------------------ */
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  /* ------------------ LOAD QUESTIONS ONCE ------------------ */
  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      const stored = JSON.parse(sessionStorage.getItem("interviewData") || "{}");

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: stored.jobTitle,
          jobLevel: stored.jobLevel,
          resumeText: stored.resumeText,
        }),
      });

      const data = await res.json();

      if (!data.questions) {
        setQuestion("No questions received");
        return;
      }

      const questionList = data.questions
        .split("\n")
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0);

      if (questionList.length === 0) {
        setQuestion("No questions received");
        return;
      }

      setQuestions(questionList);
      setQuestion(questionList[0]);
      setQuestionIndex(0);
    } catch (err) {
      console.error(err);
      setQuestion("Unable to load questions. Try again.");
    }
  }

  /* ------------------ READ QUESTION ALOUD ------------------ */
  useEffect(() => {
    if (!question || question.includes("Loading")) return;

    const utterance = new SpeechSynthesisUtterance(question);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.02;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [question, selectedVoice, voices]);

  /* ------------------ SUBMIT ANSWER ------------------ */
  async function submitAnswer() {
    if (!answer.trim()) return;

    const updatedTranscript = [...transcript, { question, answer }];
    setTranscript(updatedTranscript);

    sessionStorage.setItem(
      "interviewTranscript",
      JSON.stringify(updatedTranscript)
    );

    setAnswer("");

    // If finished all 10 questions → go to results
    if (updatedTranscript.length >= 10) {
      window.location.href = "/results";
      return;
    }

    // Load next question
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setQuestion(questions[nextIndex]);
  }

  /* ------------------ UI ------------------ */
  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f6f8",
        fontFamily: "Arial",
        paddingBottom: "40px", // ← NEW SPACING FIX
      }}
    >
      <div
        style={{
          width: "1200px",
          height: "90vh",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* INTERVIEWER */}
        <div
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: "20px",
            paddingLeft: "30px",
            paddingRight: "30px",
            background: "#fafafa",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "10px",
              fontSize: "22px",
              fontWeight: "bold",
              color: "#0b3c6d",
            }}
          >
            Interviewer Talking Text
          </h2>

          {/* VOICE DROPDOWN */}
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "15px",
              width: "260px",
            }}
          >
            <option value="default">Default Voice</option>
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>

          {/* IMAGE */}
          <img
            src={voiceImages[selectedVoice] || voiceImages.default}
            alt="Interviewer"
            style={{
              width: "220px",
              height: "220px",
              objectFit: "cover",
              borderRadius: "50%",
              boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
              marginBottom: "20px",
            }}
          />

          {/* QUESTION BOX */}
          <div
            style={{
              marginTop: "20px",
              background: "white",
              padding: "20px 30px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "20px",
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            {question}
          </div>
        </div>

        {/* TRANSCRIPT */}
        <div
          style={{
            flex: 1,
            borderLeft: "1px solid #ddd",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <h3>Interview Transcript</h3>
          {transcript.map((item, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <strong>Q:</strong>
              <div>{item.question}</div>
              <strong>A:</strong>
              <div>{item.answer}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ANSWER BAR */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          width: "1200px",
          background: "white",
          padding: "15px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          gap: "10px",
        }}
      >
        <textarea
          ref={answerRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your interview answer here..."
          style={{
            flex: 1,
            height: 80,
            fontSize: 16,
            border: "2px solid #0078ff",
            borderRadius: "8px",
            padding: "10px",
          }}
        />

        {/* 🔥 YOUR POPUP BUTTON IS BACK */}
        <button
          onClick={() => {
            answerRef.current?.focus();
            answerRef.current?.select();

            const keyboardEvent = new KeyboardEvent("keydown", {
              key: "d",
              code: "KeyD",
              bubbles: true,
            });

            answerRef.current?.dispatchEvent(keyboardEvent);
            setShowVoiceHelp(true);
          }}
          style={{
            padding: "12px 22px",
            background: "#0057ff",
            color: "white",
            fontWeight: "bold",
            borderRadius: "10px",
            border: "none",
            boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
            cursor: "pointer",
            fontSize: "17px",
          }}
        >
          🎤 Start Voice Recording
        </button>

        <button
          onClick={submitAnswer}
          style={{
            padding: "10px 20px",
            background: "#28a745",
            color: "white",
            fontWeight: "bold",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Submit Answer
        </button>
      </div>

      {/* POPUP OVERLAY */}
      {showVoiceHelp && (
        <div
          onClick={() => setShowVoiceHelp(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.45)",
            zIndex: 999,
          }}
        />
      )}

      {/* POPUP BOX */}
      {showVoiceHelp && (
        <div
          style={{
            position: "fixed",
            bottom: "120px",
            right: "40px",
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
            width: "340px",
            zIndex: 1000,
            animation: "popIn 0.25s ease-out",
          }}
        >
          <h3>Use Voice Typing</h3>
          <p>You can use your device’s built-in speech-to-text:</p>

          <ul>
            <li><strong>Chromebook:</strong> Search + D</li>
            <li><strong>Windows:</strong> Windows + H</li>
            <li><strong>Mac:</strong> Fn twice</li>
            <li><strong>iPhone/iPad:</strong> Keyboard mic</li>
            <li><strong>Android:</strong> Keyboard mic</li>
          </ul>

          <button
            onClick={() => {
              setShowVoiceHelp(false);
              setTimeout(() => answerRef.current?.focus(), 50);
            }}
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              background: "#ddd",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
