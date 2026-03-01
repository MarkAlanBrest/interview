"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState(false);

  // ⭐ FILE UPLOAD HANDLER (DOCX + PDF + TXT)
  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();

    // ⭐ DOCX (Mammoth)
    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setResumeText(result.value);
      setResumeUploaded(true);
      return;
    }

    // ⭐ TXT
    if (ext === "txt") {
      const text = await file.text();
      setResumeText(text);
      setResumeUploaded(true);
      return;
    }

    // ⭐ PDF
    if (ext === "pdf") {
      const reader = new FileReader();

      reader.onload = async () => {
        const typedArray = new Uint8Array(reader.result as ArrayBuffer);

        const pdfjsLib = await import("pdfjs-dist/build/pdf");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
        }

        setResumeText(fullText);
        setResumeUploaded(true);
      };

      reader.readAsArrayBuffer(file);
      return;
    }

    alert("Unsupported file type. Please upload a DOCX, PDF, or TXT file.");
  }

  function startInterview() {
    if (!jobTitle || !jobLevel || !resumeUploaded) {
      alert("Please upload your resume and complete all required fields.");
      return;
    }

    const interviewData = {
      jobTitle,
      jobLevel,
      resumeText,
      startTime: new Date().toISOString(),
    };

    sessionStorage.setItem("interviewData", JSON.stringify(interviewData));
    router.push("/interview");
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginBottom: 5 }}>New Castle School of Trades Interviewer</h1>
        <p style={{ color: "#555", marginTop: 0 }}>
          Upload your resume and select the job you want to practice interviewing for.
        </p>

        {/* JOB TITLE */}
        <Section title="Job Title (Required)">
          <input
            placeholder="e.g., Welder, Carpenter, HVAC Technician"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            style={inputStyle}
          />
        </Section>

        {/* JOB LEVEL */}
        <Section title="Job Level (Required)">
          <select
            value={jobLevel}
            onChange={(e) => setJobLevel(e.target.value)}
            style={{ ...inputStyle, background: "white" }}
          >
            <option value="">Select job level...</option>
            <option>Apprentice</option>
            <option>Junior</option>
            <option>Intermediate</option>
            <option>Senior</option>
            <option>Lead</option>
            <option>Supervisor</option>
            <option>Manager</option>
            <option>Director</option>
          </select>
        </Section>

        {/* RESUME UPLOAD */}
        <Section title="Resume Upload (Required)">
          <input
            id="resumeFile"
            type="file"
            accept=".pdf,.txt,.docx"
            style={{ display: "none" }}
            onChange={handleResumeUpload}
          />

          <button
            onClick={() => document.getElementById("resumeFile")?.click()}
            style={uploadButtonStyle}
          >
            Upload Resume File
          </button>

          {resumeUploaded && (
            <p style={{ color: "green", marginTop: 8, fontWeight: "bold" }}>
              ✓ Resume uploaded successfully
            </p>
          )}
        </Section>

        {/* EXPECTATIONS */}
        <div style={noticeStyle}>
          <strong>Interview Expectations</strong>
          <p>This interview is customized based on your resume and job selection.</p>
          <p>You may complete the interview as many times as needed.</p>
          <p>A completion certificate is issued once a score of <b>80% or higher</b> is achieved.</p>
        </div>

        <button onClick={startInterview} style={buttonStyle}>
          Start Interview
        </button>
      </div>
    </main>
  );
}

/* ---------- components ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 25 }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

/* ---------- styles ---------- */

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f6f8",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  fontFamily: "Arial",
};

const cardStyle = {
  width: 850,
  background: "white",
  padding: 40,
  borderRadius: 12,
  boxShadow: "0 10px 28px rgba(0,0,0,0.15)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginBottom: 12,
  fontSize: 16,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const uploadButtonStyle = {
  marginTop: 10,
  padding: "10px 14px",
  background: "#0b3c6d",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 16,
};

const noticeStyle = {
  marginTop: 25,
  background: "#f1f5f9",
  padding: 15,
  borderRadius: 8,
  fontSize: 14,
  color: "#444",
};

const buttonStyle = {
  width: "100%",
  marginTop: 25,
  padding: 14,
  fontSize: 18,
  background: "#0b3c6d",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
