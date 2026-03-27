"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const [openTile, setOpenTile] = useState<string | null>(null);

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
      {/* LEFT SIDEBAR */}
      <div style={sidebarStyle}>
        <h2 style={sidebarTitle}>Setup</h2>

        <div style={progressItem(jobTitle !== "")}>1. Job Title</div>
        <div style={progressItem(jobLevel !== "")}>2. Experience Level</div>
        <div style={progressItem(resumeUploaded)}>3. Resume Upload</div>

        <div style={{ marginTop: "auto" }}>
          <button onClick={startInterview} style={startButton}>
            Start Interview
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={contentStyle}>
        <h1 style={headerTitle}>NCST AI Interview Coach</h1>
        <p style={headerSubtitle}>Complete the steps below to begin your practice interview.</p>

        {/* TILE GRID */}
        <div style={tileGrid}>

          {/* TILE 1 */}
          <Tile
            title="Job Title"
            open={openTile === "title"}
            onClick={() => setOpenTile(openTile === "title" ? null : "title")}
          >
            <input
              placeholder="Example: Welder, Carpenter, HVAC Technician"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              style={inputStyle}
            />
          </Tile>

          {/* TILE 2 */}
          <Tile
            title="Experience Level"
            open={openTile === "level"}
            onClick={() => setOpenTile(openTile === "level" ? null : "level")}
          >
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
          </Tile>

          {/* TILE 3 */}
          <Tile
            title="Upload Resume"
            open={openTile === "resume"}
            onClick={() => setOpenTile(openTile === "resume" ? null : "resume")}
          >
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
              Upload Resume File
            </button>

            {resumeUploaded && (
              <p style={successText}>✓ Resume uploaded successfully</p>
            )}
          </Tile>
        </div>

        {/* EXPECTATIONS */}
        <div style={noticeBox}>
          <strong>Interview Expectations</strong>
          <p>You may complete the interview as many times as needed.</p>
          <p>A certificate is issued once you score <b>80% or higher</b>.</p>
        </div>
      </div>
    </main>
  );
}

/* ---------- TILE COMPONENT ---------- */

function Tile({
  title,
  open,
  onClick,
  children,
}: {
  title: string;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={tileStyle(open)} onClick={onClick}>
      <div style={tileHeader}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 22 }}>{open ? "−" : "+"}</span>
      </div>

      {open && <div style={tileContent}>{children}</div>}
    </div>
  );
}

/* ---------- STYLES ---------- */

const pageStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#f1f5f9",
  fontFamily: "Inter, Arial",
};

const sidebarStyle = {
  width: 240,
  background: "#1e293b",
  color: "white",
  padding: 25,
  display: "flex",
  flexDirection: "column" as const,
};

const sidebarTitle = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 20,
};

const progressItem = (done: boolean) => ({
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.15)",
  color: done ? "#4ade80" : "#e2e8f0",
  fontWeight: done ? 700 : 400,
});

const startButton = {
  width: "100%",
  padding: 14,
  background: "#4f46e5",
  border: "none",
  borderRadius: 8,
  color: "white",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};

const contentStyle = {
  flex: 1,
  padding: "40px 60px",
};

const headerTitle = {
  fontSize: 32,
  fontWeight: 800,
  color: "#1e293b",
  marginBottom: 6,
};

const headerSubtitle = {
  fontSize: 16,
  color: "#475569",
  marginBottom: 30,
};

const tileGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 20,
};

const tileStyle = (open: boolean) => ({
  background: "white",
  padding: 20,
  borderRadius: 14,
  boxShadow: open
    ? "0 8px 24px rgba(0,0,0,0.15)"
    : "0 4px 12px rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "0.2s",
});

const tileHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const tileContent = {
  marginTop: 15,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
};

const uploadButton = {
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

const noticeBox = {
  marginTop: 40,
  background: "#e2e8f0",
  padding: 20,
  borderRadius: 12,
  fontSize: 14,
  color: "#1f2937",
};
