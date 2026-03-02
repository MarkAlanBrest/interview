"use client";

import { useEffect, useState, useRef } from "react";
import "./print.css";

export default function ResultsPage() {
  const [results, setResults] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadResults() {
      const transcript = JSON.parse(
        sessionStorage.getItem("interviewTranscript") || "[]"
      );

      const interviewData = JSON.parse(
        sessionStorage.getItem("interviewData") || "{}"
      );

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript, interviewData }),
      });

      const data = await res.json();
      setResults(data);
    }

    loadResults();
  }, []);

  if (!results) {
    return (
      <div className="center">
        <h2>Evaluating interview...</h2>
      </div>
    );
  }

  const score = results.totalScore ?? 0;
  const passed = results.passed;

  // ⭐ NEW — replaces the broken PDF API call
  function downloadPDF() {
    window.print();
  }

  return (
    <div ref={reportRef} className="report">

      {/* ================= CERTIFICATE HEADER ================= */}

      <div className={`certificateHeader ${passed ? "pass" : "fail"}`}>
        <h1>
          {passed
            ? "Interview Completion Certificate"
            : "Interview Practice Report"}
        </h1>

        <div className="scoreBadge">{score}%</div>

        <div className="points">
          Points: {results.earnedPoints} / {results.possiblePoints}
        </div>

        <div className={`status ${passed ? "passed" : "retry"}`}>
          {passed
            ? "✅ Completion Standard Met"
            : "⚠ Practice Attempt — Improve and Retry"}
        </div>

        {/* ⭐ NEW — print-to-PDF button */}
        <button className="downloadBtn" onClick={downloadPDF}>
          ⬇ DOWNLOAD / PRINT PDF
        </button>

        <p className="submitMsg">
          {passed
            ? "Submit this certificate in Canvas for credit."
            : "Review feedback and retry the interview to earn certification."}
        </p>

        <div className="verify">
          Verification Code: {results.verificationCode}
        </div>
      </div>

      {/* ================= OVERALL FEEDBACK ================= */}

      <section className="section">
        <h2>Overall Feedback</h2>
        <p>{results.feedback}</p>
      </section>

      {/* ================= TEACHER SUMMARY ================= */}

      {results.teacherSummary && (
        <section className="section teacherBox">
          <h2>Teacher Summary</h2>
          <p>{results.teacherSummary}</p>
        </section>
      )}

      {/* ================= QUESTION FEEDBACK ================= */}

      {results.questions?.length > 0 && (
        <section className="section">
          <h2>Question-by-Question Evaluation</h2>

          {results.questions.map((q: any, i: number) => (
            <div key={i} className="questionCard">
              <div className="questionHeader">
                <span>Question {i + 1}</span>
                <span className="miniScore">
                  {q.score}/{q.maxScore}
                </span>
              </div>

              <div className="questionText">{q.question}</div>
              <div className="feedback">{q.feedback}</div>
            </div>
          ))}
        </section>
      )}

      {/* ================= SUGGESTIONS ================= */}

      {results.suggestions?.length > 0 && (
        <section className="section">
          <h2>Improvement Suggestions</h2>
          <ul>
            {results.suggestions.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ================= TRANSCRIPT ================= */}

      <section className="section transcript">
        <h2>Interview Transcript</h2>

        {results.transcript?.map((t: any, i: number) => (
          <div key={i} className="qa">
            <strong>Question {i + 1}</strong>
            <p>{t.question}</p>

            <strong>Answer</strong>
            <p>{t.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
