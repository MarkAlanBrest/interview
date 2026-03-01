// app/api/pdf/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
  const body = await req.json();
  const { results } = body;

  const html = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
          }

          .score {
            font-size: 48px;
            font-weight: bold;
            color: #2a7ae2;
            margin-top: 10px;
          }

          h2 {
            border-bottom: 2px solid #ddd;
            padding-bottom: 6px;
            margin-top: 40px;
          }

          .section {
            margin-bottom: 20px;
          }

          .question {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 6px;
          }

          .transcript-item {
            margin-bottom: 12px;
          }
        </style>
      </head>

      <body>
        <div class="header">
          <h1>Interview Evaluation Report</h1>
          <div class="score">${results.totalScore ?? results.score ?? 0}%</div>
        </div>

        <h2>Overall Feedback</h2>
        <p>${results.feedback}</p>

        ${
          results.teacherSummary
            ? `
          <h2>Teacher Summary</h2>
          <p>${results.teacherSummary}</p>
        `
            : ""
        }

        ${
          results.questions?.length
            ? `
          <h2>Question-by-Question Evaluation</h2>
          ${results.questions
            .map(
              (q: any, i: number) => `
            <div class="question">
              <strong>Question ${i + 1} (${q.score}/${q.maxScore})</strong>
              <p>${q.question}</p>
              <p><em>${q.feedback}</em></p>
            </div>
          `
            )
            .join("")}
        `
            : ""
        }

        ${
          results.suggestions?.length
            ? `
          <h2>Improvement Suggestions</h2>
          <ul>
            ${results.suggestions.map((s: string) => `<li>${s}</li>`).join("")}
          </ul>
        `
            : ""
        }

        <h2>Interview Transcript</h2>
        ${results.transcript
          .map(
            (t: any, i: number) => `
          <div class="transcript-item">
            <strong>Question ${i + 1}</strong>
            <p>${t.question}</p>
            <strong>Answer</strong>
            <p>${t.answer}</p>
          </div>
        `
          )
          .join("")}
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "Letter",
    printBackground: true,
    margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
  });

  await browser.close();

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Interview_Report.pdf",
    },
  });
}
