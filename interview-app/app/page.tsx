"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [program, setProgram] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [resumeText, setResumeText] = useState("");

  function startInterview() {
    if (!studentName || !jobTitle) {
      alert("Please enter your name and job title.");
      return;
    }

    const interviewData = {
      studentName,
      program,
      jobTitle,
      company,
      jobPosting,
      resumeText,
      startTime: new Date().toISOString(),
    };

    sessionStorage.setItem(
      "interviewData",
      JSON.stringify(interviewData)
    );

    router.push("/interview");
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1>AI Interview Coach</h1>
        <p style={{ color: "#555" }}>
          Complete a realistic job interview simulation tailored to the
          position you are applying for.
        </p>

        {/* STUDENT */}
        <Section title="Applicant Information">
          <input
            placeholder="Student Name *"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Program / Class"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            style={inputStyle}
          />
        </Section>

        {/* JOB */}
        <Section title="Position Details">
          <input
            placeholder="Job Title Applying For *"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={inputStyle}
          />
        </Section>

        {/* JOB POSTING */}
        <Section title="Job Posting (Recommended)">
          <textarea
            placeholder="Paste the job advertisement here to generate customized interview questions."
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            style={{ ...inputStyle, height: 120 }}
          />
        </Section>

        {/* RESUME */}
        <Section title="Resume (Optional)">
          <textarea
            placeholder="Paste resume text to allow the interviewer to ask personalized questions."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            style={{ ...inputStyle, height: 120 }}
          />
        </Section>

        {/* EXPECTATIONS */}
        <div style={noticeStyle}>
          <strong>Interview Expectations</strong>
          <p>
            This interview may be completed as many times as needed.
            Your goal is to reach a professional interview standard.
          </p>
          <p>
            A completion certificate is issued once a score of
            <b> 80% or higher </b> is achieved.
          </p>
          <p>
            Review feedback after each attempt and improve your
            responses before retrying.
          </p>
          <p style={{ marginBottom: 0 }}>
            Your responses will be recorded and included in your final
            report.
          </p>
        </div>

        <button onClick={startInterview} style={buttonStyle}>
          Start Interview
        </button>
      </div>
    </main>
  );
}

/* ---------- components ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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