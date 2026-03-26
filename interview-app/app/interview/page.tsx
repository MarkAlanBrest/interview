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

  /* ------------------ NEW VIDEO RECORDING STATE ------------------ */
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [showPlayback, setShowPlayback] = useState(false);

  const previewRef = useRef<HTMLVideoElement>(null);

  const [interviewComplete, setInterviewComplete] = useState(false);

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

  /* ------------------ VIDEO RECORDING FUNCTIONS ------------------ */

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play();
      }

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setMediaStream(stream);
    } catch (err) {
      console.error("Error starting video recording:", err);
    }
  }

  function stopRecording() {
    try {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (previewRef.current) {
        previewRef.current.srcObject = null;
      }
    } catch (err) {
      console.error("Error stopping video recording:", err);
    }
  }

  function saveRecording() {
    if (!videoURL) return;
    const a = document.createElement("a");
    a.href = videoURL;
    a.download = "interview_recording.webm";
    a.click();
  }

  /* ------------------ CLEANUP ON UNMOUNT ------------------ */
  useEffect(() => {
    return () => stopRecording();
  }, []);

  /* ------------------ LOAD QUESTIONS ------------------ */
  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("interviewData") || "{}"
      );

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
        .map((q: string) =>
          q.trim().replace(/^\d+[).\s-]*/, "")
        )
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

    if (updatedTranscript.length >= 10) {
      setInterviewComplete(true);
      return;
    }

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
        background: "linear-gradient(to bottom, #cbd5e1, #64748b)",
        fontFamily: "Arial",
        paddingBottom: "40px",
      }}
    >
      <div
        style={{
          width: "1500px",
          height: "90vh",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* ------------------ NEW RECORDING PANEL ------------------ */}
        <div
          style={{
            width: "300px",
            background: "#fafafa",
            borderRight: "1px solid #ddd",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Recording Panel</h3>

          {/* Small Preview */}
          <video
            ref={previewRef}
            muted
            style={{
              width: "100%",
              height: "180px",
              background: "black",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />

          <button
            onClick={startRecording}
            style={{
              width: "100%",
              padding: "10px",
              background: "#0057ff",
              color: "white",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ▶️ Record Interview
          </button>

          <button
            onClick={stopRecording}
            style={{
              width: "100%",
              padding: "10px",
              background: "#d9534f",
              color: "white",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ⏹ Stop Recording
          </button>

          <button
            onClick={() => setShowPlayback(true)}
            disabled={!videoURL}
            style={{
              width: "100%",
              padding: "10px",
              background: videoURL ? "#0b3c6d" : "#999",
              color: "white",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: videoURL ? "pointer" : "not-allowed",
            }}
          >
            🎥 Play Back Interview
          </button>

          <button
            onClick={saveRecording}
            disabled={!videoURL}
            style={{
              width: "100%",
              padding: "10px",
              background: videoURL ? "#28a745" : "#999",
              color: "white",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: videoURL ? "pointer" : "not-allowed",
            }}
          >
            💾 Save Interview
          </button>
        </div>

        {/* ------------------ INTERVIEWER PANEL ------------------ */}
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

        {/* ------------------ TRANSCRIPT PANEL ------------------ */}
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
              <strong>Question {i + 1}</strong>
              <div>{item.question}</div>
              <strong>Answer</strong>
              <div>{item.answer}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------ ANSWER BAR ------------------ */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          width: "1500px",
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

        {interviewComplete && (
          <button
            onClick={() => (window.location.href = "/results")}
            style={{
              padding: "10px 20px",
              background: "#0b3c6d",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Next →
          </button>
        )}
      </div>

      {/* ------------------ PLAYBACK MODAL ------------------ */}
      {showPlayback && (
        <>
          <div
            onClick={() => setShowPlayback(false)}
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

          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              width: "640px",
              maxWidth: "95vw",
              boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
              zIndex: 1000,
            }}
          >
            <h3>Interview Recording</h3>

            {videoURL ? (
              <video
                controls
                style={{
                  width: "100%",
                  marginTop: "10px",
                  borderRadius: "8px",
                  background: "black",
                }}
              >
                <source src={videoURL} type="video/webm" />
              </video>
            ) : (
              <p>No video recorded.</p>
            )}

            <button
              onClick={() => setShowPlayback(false)}
              style={{
                marginTop: "15px",
                padding: "10px 15px",
                background: "#ddd",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* ------------------ VOICE HELP POPUP ------------------ */}
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
            <li><strong>Windows:</strong> Windows + H