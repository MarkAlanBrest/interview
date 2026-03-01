"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("Loading interview question...");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<
    { question: string; answer: string }[]
  >([]);

  /* ===========================
     Speech Engine
  =========================== */

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const readyRef = useRef(true);

  /* ===========================
     Get Custom Question (SAFE)
  =========================== */

  async function getQuestion(previous: string[] = []) {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("interviewData") || "{}"
      );

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...stored,
          previousQuestions: previous,
        }),
      });

      if (!res.ok) throw new Error("API failed");

      const data = await res.json();

      setQuestion(data?.question || "No question received");
    } catch (err) {
      console.error(err);
      setQuestion("Unable to load question. Try again.");
    }
  }

  /* ===========================
     Load First Question
  =========================== */

  useEffect(() => {
    getQuestion();
  }, []);

  /* ===========================
     Speak Question
  =========================== */

  useEffect(() => {
    if (!question || question.includes("Loading")) return;

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "en-US";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [question]);

  /* ===========================
     Voice Controls
  =========================== */

  function startListening() {
    if (!readyRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += text + " ";
        } else {
          interim += text;
        }
      }

      setAnswer(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      readyRef.current = true;
      setListening(false);
    };

    readyRef.current = false;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  /* ===========================
     Submit Answer
  =========================== */

  async function submitAnswer() {
    if (!answer.trim()) return;

    const updatedTranscript = [
      ...transcript,
      { question, answer },
    ];

    setTranscript(updatedTranscript);

    sessionStorage.setItem(
      "interviewTranscript",
      JSON.stringify(updatedTranscript)
    );

    finalTranscriptRef.current = "";
    setAnswer("");

    if (updatedTranscript.length >= 10) {
      window.location.href = "/results";
      return;
    }

    setQuestion("Loading next question...");

    await getQuestion(
      updatedTranscript.map((t) => t.question)
    );
  }

  /* ===========================
     UI
  =========================== */

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f6f8",
        fontFamily: "Arial",
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
            justifyContent: "center",
            padding: "30px",
            background: "#fafafa",
          }}
        >
          <img
            src="/images/interviewer.png"
            alt="Interviewer"
            style={{ maxHeight: "45%" }}
          />

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
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type or speak your interview answer here..."
          style={{ flex: 1, height: 80, fontSize: 16 }}
        />

        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onMouseLeave={stopListening}
          style={{
            padding: "10px 16px",
            background: listening ? "#ff4d4d" : "#eee",
            cursor: "pointer",
          }}
        >
          🎤 Hold to Speak
        </button>

        <button
          onClick={submitAnswer}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Submit Answer
        </button>
      </div>
    </main>
  );
}