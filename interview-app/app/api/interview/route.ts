import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ===========================
   GET (first question fallback)
=========================== */

export async function GET() {
  return Response.json({
    question: "Tell me about yourself.",
  });
}

/* ===========================
   POST (AI interview questions)
=========================== */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      jobTitle,
      company,
      jobPosting,
      resumeText,
      previousQuestions = [],
    } = body;

    const questionNumber = previousQuestions.length + 1;

    /* ---------------------------
       Interview Stage Logic
    --------------------------- */

    let stageInstruction = "";

    if (questionNumber <= 2) {
      stageInstruction = `
Warm-up stage.
Ask general introductory interview questions.
Examples:
- Tell me about yourself.
- Why are you interested in this field?
DO NOT ask technical questions yet.
`;
    } else if (questionNumber <= 5) {
      stageInstruction = `
Behavioral stage.
Ask questions about work ethic, teamwork, responsibility,
and past experiences.
Lightly relate to the job but avoid deep technical skills.
`;
    } else if (questionNumber <= 8) {
      stageInstruction = `
Role-specific stage.
Ask practical questions appropriate for an ENTRY LEVEL ${jobTitle}.
Do NOT assume expert knowledge.
`;
    } else {
      stageInstruction = `
Reflection and problem-solving stage.
Ask situational or growth-focused questions such as:
- handling challenges
- learning new skills
- workplace professionalism
Avoid highly technical testing questions.
`;
    }

    /* ---------------------------
       Prompt
    --------------------------- */

    const prompt = `
You are a professional hiring manager conducting a structured interview.

Interview Question Number: ${questionNumber}

${stageInstruction}

Context:
Job Title: ${jobTitle || "Not provided"}
Company: ${company || "Not provided"}

Job Posting:
${jobPosting || "Not provided"}

Candidate Resume:
${resumeText || "Not provided"}

Rules:
- Ask ONE question only.
- Keep questions appropriate for students or entry-level applicants.
- NEVER repeat or rephrase a previous question.
- Each question must explore a NEW topic or skill area.
- Do NOT explain or add commentary.
- Return ONLY the question text.

Previous Questions:
${previousQuestions.join("\n")}
`;

    /* ---------------------------
       OpenAI Call (safe)
    --------------------------- */

    let question = "Tell me about yourself.";

    try {
      const completion =
        await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a supportive but professional interviewer working with students and entry-level candidates.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

      question =
        completion.choices[0].message.content?.trim() ||
        question;
    } catch (err) {
      console.error("Interview question error:", err);
    }

    return Response.json({ question });
  } catch (err) {
    console.error("Route error:", err);

    return Response.json({
      question: "Tell me about yourself.",
    });
  }
}