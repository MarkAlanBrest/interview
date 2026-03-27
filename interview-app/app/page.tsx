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
      <div style={cardStyle}>

        {/* HEADER */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>NCST AI Interview Coach</h1>
          <p style={subtitleStyle}>Practice. Improve. Earn Your Certificate.</p>
        </div>

        {/* JOB TITLE */}
        <Section title="Job Title">
          <input
            placeholder="Example: Welder, Carpenter, HVAC Technician"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            style={inputStyle}
          />
        </Section>

        {/* JOB LEVEL */}
        <Section title="Experience Level">
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
        <Section title="Upload Resume">
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
            <p style={successText}>✓ Resume uploaded successfully</p>
          )}
        </Section>

        {/* EXPECTATIONS */}
        <div style={noticeStyle}>
          <strong>Interview Expectations</strong>
          <p>You may complete the interview as many times as needed.</p>
          <p>A certificate is issued once you score <b>80% or higher</b>.</p>
        </div>

        <button onClick={startInterview} style={buttonStyle}>
          Start Interview
        </button>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

/* ---------- styles ---------- */

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #dbeafe, #e2e8f0)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  fontFamily: "Inter, Arial",
};

const cardStyle = {
  width: 700,
  background: "white",
  padding: 35,
  borderRadius: 16,
  boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
};

const headerStyle = {
  textAlign: "center" as const,
  marginBottom: 30,
  paddingBottom: 20,
  borderBottom: "1px solid #e5e7eb",
};

const titleStyle = {
  fontSize: 32,
  fontWeight: 800,
  color: "#1e293b",
  marginBottom: 6,
};

const subtitleStyle = {
  fontSize: 16,
  color: "#475569",
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 600,
  color: "#1e293b",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  marginTop: 4,
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
};

const uploadButtonStyle = {
  marginTop: 10,
  padding: "12px 16px",
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 600,
};

const successText = {
  color: "#16a34a",
  marginTop: 8,
  fontWeight: "bold",
};

const noticeStyle = {
  marginTop: 25,
  background: "#f1f5f9",
  padding: 15,
  borderRadius: 10,
  fontSize: 14,
  color: "#1f2937",
  border: "1px solid #e2e8f0",
};

const buttonStyle = {
  width: "100%",
  marginTop: 30,
  padding: 16,
  fontSize: 18,
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};
