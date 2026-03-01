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
}