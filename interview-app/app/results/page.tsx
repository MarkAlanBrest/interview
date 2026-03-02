"use client";

import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

  // ⭐ NEW — true client-side PDF generation (no print dialog)
 async function downloadPDF() {
  const element = reportRef.current;
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "letter");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Additional pages
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("Interview_Report.pdf");
}


    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "letter");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
    pdf.save("Interview_Report.pdf");
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

        {/* ⭐ NEW — instant PDF download */}
        <button className="downloadBtn" onClick={downloadPDF}>
          ⬇ DOWNLOAD PDF
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
