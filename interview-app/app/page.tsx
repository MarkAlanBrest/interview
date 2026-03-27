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
    <main style={pageStyle}>
      <div style={panelStyle}>

        {/* HEADER */}
        <h1 style={headerTitle}>NCST Interview Setup</h1>
        <p style={headerSubtitle}>Complete the steps below to begin.</p>

        {/* JOB TITLE */}
        <div style={section}>
          <label style={label}>Job Title</label>
          <input
            placeholder="Welder, Carpenter, HVAC Technician..."
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            style={input}
          />
        </div>

        {/* EXPERIENCE LEVEL — PILL BUTTONS */}
        <div style={section}>
          <label style={label}>Experience Level</label>

          <div style={pillRow}>
            {[
              "Apprentice",
              "Junior",
              "Intermediate",
              "Senior",
              "Lead",
              "Supervisor",
              "Manager",
              "Director",
            ].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setJobLevel(lvl)}
                style={pill(jobLevel === lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* RESUME UPLOAD */}
        <div style={section}>
          <label style={label}>Resume Upload</label>

          <div style={uploadCard}>
            <input
              id="resumeFile"
              type="file"
              accept=".pdf,.txt,.docx"
              style={{ display: "none" }}
              onChange={handleResumeUpload}
            />

            <button
              onClick={() => document.getElementById("resumeFile")?.click()}
              style={uploadButton}
            >
              Choose File
            </button>

            {resumeUploaded ? (
              <span style={success}>✓ Uploaded</span>
            ) : (
              <span style={pending}>No file selected</span>
            )}
          </div>
        </div>

        {/* EXPECTATIONS */}
        <div style={noticeBox}>
          <strong>Interview Expectations</strong>
          <p>You may complete the interview as many times as needed.</p>
          <p>A certificate is issued once you score <b>80% or higher</b>.</p>
        </div>

        {/* DIRECTIONS */}
        <div style={directionsBox}>
          <ul style={directionsList}>
            <li>Record yourself to see how you do, then watch it to see yourself squirm.</li>
            <li>You are only required to submit the final PDF results to Canvas.</li>
            <li>Use your real resume — the AI tailors questions to your experience.</li>
            <li>Answer out loud. The system is designed for spoken responses.</li>
          </ul>
        </div>

        {/* START BUTTON */}
        <button onClick={startInterview} style={startButton}>
          Start Interview
        </button>
      </div>
    </main>
  );
}

/* ---------- STYLES ---------- */

const pageStyle = {
  minHeight: "100vh",
  background: "#f1f5f9",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Inter, Arial",
};

const panelStyle = {
  width: 600,
  background: "white",
  padding: 40,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
};

const headerTitle = {
  fontSize: 28,
  fontWeight: 800,
  color: "#1e293b",
  marginBottom: 4,
};

const headerSubtitle = {
  fontSize: 15,
  color: "#475569",
  marginBottom: 30,
};

const section = {
  marginBottom: 25,
};

const label = {
  display: "block",
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 6,
  color: "#1e293b",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
};

const pillRow = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
};

const pill = (active: boolean) => ({
  padding: "8px 14px",
  borderRadius: 20,
  border: active ? "2px solid #1e3a8a" : "1px solid #cbd5e1",
  background: active ? "#1e3a8a" : "white",
  color: active ? "white" : "#1e293b",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
});

const uploadCard = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
};

const uploadButton = {
  padding: "8px 14px",
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

const success = {
  color: "#16a34a",
  fontWeight: 700,
};

const pending = {
  color: "#64748b",
};

const noticeBox = {
  marginTop: 20,
  background: "#e2e8f0",
  padding: 16,
  borderRadius: 12,
  fontSize: 14,
  color: "#1f2937",
};

const directionsBox = {
  marginTop: 20,
  background: "#f8fafc",
  padding: "14px 18px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
};

const directionsList = {
  margin: 0,
  paddingLeft: 20,
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.5,
};

const startButton = {
  width: "100%",
  marginTop: 25,
  padding: 16,
  fontSize: 18,
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};
