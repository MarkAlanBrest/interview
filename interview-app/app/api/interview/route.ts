import OpenAI from "openai";
import { NextRequest } from "next/server";
export async function POST(req: NextRequest) {
  const { jobTitle, jobLevel, resumeText } = await req.json();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const systemPrompt = `
You are an AI Interview Generator for New Castle School of Trades.

You will receive:
- The applicant’s resume text
- The job title they want
- The job level they selected (Apprentice, Junior, Intermediate, Senior, Lead, Supervisor, Manager, Director)

Your job is to generate a realistic, highly customized interview with EXACTLY 10 questions.

RULES:
1. Read the resume and extract:
   - Skills
   - Tools and equipment
   - Certifications
   - Work experience
   - Achievements
   - Soft skills
   - Gaps or missing experience

2. Create a realistic job posting internally based on the job title and job level.

3. Generate EXACTLY 10 interview questions in this structure:
   - Question 1: A common opener such as “Tell me about yourself.”
   - Questions 2–4: Resume-based questions (skills, tools, experience, certifications, gaps)
   - Questions 5–8: Job-title and job-level specific questions
   - Question 9: A scenario question appropriate for the job level
   - Question 10: Always end with “Do you have any questions for us?”

4. Questions must be specific, realistic, and tied to the applicant’s background and the job they want.

5. Return ONLY the list of questions, no explanations.
`;

  const userPrompt = `
Job Title: ${jobTitle}
Job Level: ${jobLevel}

Resume Text:
${resumeText}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.4,
  });

  const questions = completion.choices[0].message.content;

  return new Response(JSON.stringify({ questions }), {
    headers: { "Content-Type": "application/json" },
  });
}
