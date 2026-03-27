"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState(false);

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setResumeText(result.value);
      setResumeUploaded(true);
      return;
    }

    if (ext === "txt") {
      const text = await file.text();
      setResumeText(text);
      setResumeUploaded(true);
      return;
    }

    if (ext === "pdf") {
      const reader = new FileReader();

      reader.onload = async () => {
        const typedArray = new Uint8Array(reader.result as ArrayBuffer);

        const pdfjsLib = await import("pdfjs-dist");
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
    <main style={page}>
      <div style={container}>

        {/* HEADER */}
        <h1 style={title}>NCST AI Interview Setup</h1>
        <p style={subtitle}>Choose your settings below to begin.</p>

        {/* TILE GRID */}
        <div style={tileGrid}>

          {/* TILE 1 — JOB TITLE */}
          <div style={tile}>
            <h3 style={tileTitle}>Job Title</h3>
            <input
              placeholder="Welder, Carpenter, HVAC Technician..."
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              style={input}
            />
          </div>

          {/* TILE 2 — EXPERIENCE LEVEL */}
          <div style={tile}>
            <h3 style={tileTitle}>Experience Level</h3>
            <select
              value={jobLevel}
              onChange={(e) => setJobLevel(e.target.value)}
              style={dropdown}
            >
              <option value="">Select level...</option>
              <option>Apprentice</option>
              <option>Junior</option>
              <option>Intermediate</option>
              <option>Senior</option>
              <option>Lead</option>
              <option>Supervisor</option>
              <option>Manager</option>
              <option>Director</option>
            </select>
          </div>

          {/* TILE 3 — RESUME UPLOAD */}
          <div style={tile}>
            <h3 style={tileTitle}>Upload Resume</h3>

            <input
              id="resumeFile"
              type="file"
              accept=".pdf,.txt,.docx"
              style={{ display: "none" }}
              onChange={handleResumeUpload}
            />

            <button
              onClick={() => document.getElementById("resumeFile")?.click()}
              style={uploadBtn}
            >
              Choose File
            </button>

            {resumeUploaded && (
              <p style={uploaded}>✓ Resume uploaded</p>
            )}
          </div>
        </div>

        {/* DIRECTIONS */}
        <div style={directionsBox}>
          <ul style={directionsList}>
            <li>Record yourself to see how you do — watching it back is the real lesson.</li>
            <li>You only need to submit the final PDF results to Canvas.</li>
            <li>Use your real resume so the questions match your experience.</li>
            <li>Answer out loud — this is a mock interview, not a quiz.</li>
          </ul>
        </div>

        {/* START BUTTON */}
        <button onClick={startInterview} style={startBtn}>
          Start Interview
        </button>
      </div>
    </main>
  );
}

/* ---------- STYLES ---------- */

const page = {
  minHeight: "100vh",
  background: "#eef2f7",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Inter, Arial",
};

const container = {
  width: 900,
  background: "white",
  padding: 40,
  borderRadius: 18,
  boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
};

const title = {
  fontSize: 32,
  fontWeight: 800,
  color: "#1e293b",
  marginBottom: 4,
  textAlign: "center" as const,
};

const subtitle = {
  fontSize: 16,
  color: "#475569",
  marginBottom: 30,
  textAlign: "center" as const,
};

const tileGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 20,
  marginBottom: 30,
};

const tile = {
  background: "#f8fafc",
  padding: 20,
  borderRadius: 14,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  transition: "0.2s",
  cursor: "pointer",
};

const tileTitle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 10,
  color: "#1e293b",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 15,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "white",
};

const dropdown = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 15,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "white",
};

const uploadBtn = {
  padding: "10px 14px",
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
};

const uploaded = {
  marginTop: 8,
  color: "#16a34a",
  fontWeight: 700,
};

const directionsBox = {
  background: "#f1f5f9",
  padding: 18,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  marginBottom: 25,
};

const directionsList = {
  margin: 0,
  paddingLeft: 20,
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.45,
};

const startBtn = {
  width: "100%",
  padding: 16,
  fontSize: 18,
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};
