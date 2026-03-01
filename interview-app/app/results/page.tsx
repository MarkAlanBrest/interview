"use client";

import { useEffect, useState } from "react";
import "./print.css";

export default function ResultsPage() {
  const [results, setResults] = useState<any>(null);

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

async function downloadPDF() {
  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results }),
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "Interview_Report.pdf";
  a.click();

  window.URL.revokeObjectURL(url);
}


  const score = results.totalScore ?? results.score ?? 0;

  return (
    <div className="report">
      {/* HEADER */}
      <div className="certificateHeader">
        <h1>Interview Evaluation Report</h1>

        <div className="scoreBadge">{score}%</div>

        <button className="downloadBtn" onClick={downloadPDF}>
          ⬇ DOWNLOAD REPORT (PDF)
        </button>

        <p className="submitMsg">
          Submit this PDF in Canvas to receive credit.
        </p>
      </div>

      {/* OVERALL FEEDBACK */}
      <section className="section">
        <h2>Overall Feedback</h2>
        <p>{results.feedback}</p>
      </section>

      {/* TEACHER SUMMARY */}
      {results.teacherSummary && (
        <section className="section teacherBox">
          <h2>Teacher Summary</h2>
          <p>{results.teacherSummary}</p>
        </section>
      )}

      {/* QUESTION FEEDBACK */}
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

      {/* IMPROVEMENT SUGGESTIONS */}
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