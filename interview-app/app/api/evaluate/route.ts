import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transcript = body?.transcript ?? [];

    /* ===========================
       Prompt
    =========================== */

    const prompt = `
You are evaluating a student mock interview.

Each question is worth 10 points.

Give feedback for EACH answer.

Return ONLY valid JSON:

{
  "totalScore": number,
  "feedback": "overall evaluation paragraph",
  "teacherSummary": "2-3 sentence teacher summary",
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

    /* ===========================
       OpenAI Call
    =========================== */

    const completion =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You evaluate student interviews professionally and constructively.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const raw =
      completion.choices?.[0]?.message?.content ?? "";

    /* ===========================
       Safe JSON Parse
    =========================== */

    let result = {
      totalScore: 75,
      feedback: "Evaluation unavailable.",
      teacherSummary:
        "Student completed the mock interview.",
      questions: [],
      suggestions: [],
    };

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      }
    } catch (e) {
      console.log("JSON fallback used");
    }

    /* ===========================
       Response
    =========================== */

    return Response.json({
      ...result,
      transcript,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Evaluation error:", err);

    return Response.json({
      totalScore: 75,
      feedback: "Evaluation failed safely.",
      teacherSummary:
        "Student completed the mock interview.",
      questions: [],
      suggestions: [],
      transcript: [],
      timestamp: new Date().toISOString(),
    });
  }
}