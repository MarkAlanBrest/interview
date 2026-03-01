import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { interviewData, transcript } =
      await req.json();

    const prompt = `
You are evaluating a job interview.

Provide:
1. Overall score (0-100)
2. Professional feedback paragraph

Interview Context:
${JSON.stringify(interviewData)}

Transcript:
${JSON.stringify(transcript)}

Return JSON ONLY:

{
 "score": number,
 "feedback": "text"
}
`;

    const completion =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
      });

    const raw =
      completion.choices?.[0]?.message?.content ?? "";

    /* SAFE JSON PARSE */
    let parsed = {
      score: 75,
      feedback: "Evaluation unavailable.",
    };

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch {
      console.log("JSON fallback used");
    }

    return Response.json({
      ...parsed,
      transcript,
      ...interviewData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Evaluation error:", err);

    return Response.json({
      score: 75,
      feedback: "Evaluation failed safely.",
      transcript: [],
      timestamp: new Date().toISOString(),
    });
  }
}"use client";

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
        Score: {results.score ?? results.totalScore}%
      </div>

      <p className="timestamp">
        Completed: {new Date(results.timestamp).toLocaleString()}
      </p>

      <button className="downloadBtn" onClick={downloadPDF}>
        ⬇ Download PDF Certificate
      </button>

      <div className="submitMsg">
        Submit this PDF in your class assignment for grading.
      </div>

      <h2>Overall Feedback</h2>
      <p>{results.feedback}</p>

      {results.teacherSummary && (
        <>
          <h2>Teacher Summary</h2>
          <div className="teacherBox">
            {results.teacherSummary}
          </div>
        </>
      )}

      {results.questions && results.questions.length > 0 && (
        <>
          <h2>Question Feedback</h2>

          {results.questions.map((q: any, i: number) => (
            <div key={i} className="questionCard">
              <strong>Question:</strong>
              <div>{q.question}</div>

              <div className="scoreLine">
                Score: {q.score}/{q.maxScore}
              </div>

              <div>{q.feedback}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}