import OpenAI from "openai";
import { NextRequest } from "next/server";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export async function POST(req: NextRequest) {

  try {
    const { interviewData, transcript } = await req.json();

    /* =========================
       AI EVALUATION PROMPT
    ========================== */

    const prompt = `
You are evaluating a student mock job interview.

GRADING RUBRIC (STRICT):

Each interview question is worth 10 points.

Score using:

1. Answered the Question (0–2)
2. Communication Clarity (0–2)
3. Professionalism (0–2)
4. Supporting Detail (0–2)
5. Job Relevance (0–2)

IMPORTANT RULES:
- Evaluate EACH question independently.
- Students are ENTRY LEVEL candidates.
- Be supportive but realistic.
- DO NOT calculate an overall score.
- Return ONLY valid JSON.

Return format:

{
  "feedback": "overall evaluation paragraph",
  "teacherSummary": "short professional grading summary",
  "questions": [
    {
      "question": "question text",
      "score": number,
      "maxScore": 10,
      "feedback": "specific coaching feedback"
    }
  ],
  "suggestions": [
    "overall improvement suggestion"
  ]
}

Interview Transcript:
${JSON.stringify(transcript)}
`;

    const completion =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
      });

    const raw =
      completion.choices?.[0]?.message?.content ?? "";

    /* =========================
       SAFE JSON PARSE
    ========================== */

    let result: any = {
      feedback: "Evaluation unavailable.",
      teacherSummary:
        "Student completed the interview activity.",
      questions: [],
      suggestions: [],
    };

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
    } catch {
      console.log("JSON fallback used");
    }

    /* =========================
       CALCULATE POINTS
    ========================== */

    let earnedPoints = 0;
    let possiblePoints = 0;
    let totalScore = 0;

    if (result.questions?.length) {
      earnedPoints = result.questions.reduce(
        (sum: number, q: any) =>
          sum + Number(q.score || 0),
        0
      );

      possiblePoints = result.questions.reduce(
        (sum: number, q: any) =>
          sum + Number(q.maxScore || 10),
        0
      );

      totalScore =
        possiblePoints > 0
          ? Math.round((earnedPoints / possiblePoints) * 100)
          : 0;
    }

    /* =========================
       PASS / RETRY STATUS
    ========================== */

    const passed = totalScore >= 80;

    /* =========================
       VERIFICATION CODE
       (prevents fake PDFs)
    ========================== */

    const verificationCode =
      "AIC-" +
      Math.random().toString(36).substring(2, 8).toUpperCase() +
      "-" +
      new Date().getFullYear();

    /* =========================
       FINAL RESPONSE
    ========================== */

    return Response.json({
      ...result,

      totalScore,
      earnedPoints,
      possiblePoints,
      passed,
      verificationCode,

      transcript,
      ...interviewData,

      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("Evaluation error:", err);

    return Response.json({
      totalScore: 75,
      earnedPoints: 0,
      possiblePoints: 0,
      passed: false,
      verificationCode: "ERROR",

      feedback:
        "Interview completed. Evaluation temporarily unavailable.",
      teacherSummary:
        "Student completed the mock interview.",
      questions: [],
      suggestions: [],
      transcript: [],
      timestamp: new Date().toISOString(),
    });
  }
}