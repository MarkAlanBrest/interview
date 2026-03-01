"use client";

import { useEffect, useState } from "react";

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
        body: JSON.stringify({
          transcript,
          interviewData,
        }),
      });

      const data = await res.json();
      setResults(data);
    }

    loadResults();
  }, []);

  if (!results)
    return (
      <div className="center">
        <h2>Evaluating interview...</h2>
      </div>
    );

  function downloadPDF() {
    window.print();
  }

  return (
    <div className="report">
      <h1>Interview Results</h1>

      <div className="score">
        Score: {results.score}%
      </div>

      <button className="downloadBtn" onClick={downloadPDF}>
        ⬇ Download PDF Certificate
      </button>

      <h2>Overall Feedback</h2>
      <p>{results.feedback}</p>
    </div>
  );
}