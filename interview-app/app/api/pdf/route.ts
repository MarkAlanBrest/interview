import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(text: unknown) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const results = body?.results ?? {};
    const questions = normalizeArray(results.questions);
    const suggestions = normalizeArray(results.suggestions);
    const transcript = normalizeArray(results.transcript);

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
              background: white;
              margin: 0;
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
            <div class="score">${escapeHtml(results.totalScore ?? results.score ?? 0)}%</div>
          </div>

          <h2>Overall Feedback</h2>
          <p>${escapeHtml(results.feedback)}</p>

          ${results.teacherSummary ? `
            <h2>Teacher Summary</h2>
            <p>${escapeHtml(results.teacherSummary)}</p>
          ` : ""}

          ${questions.length ? `
            <h2>Question-by-Question Evaluation</h2>
            ${questions
              .map((q: any, i: number) => `
                <div class="question">
                  <strong>Question ${i + 1} (${escapeHtml(q.score)} / ${escapeHtml(q.maxScore)})</strong>
                  <p>${escapeHtml(q.question)}</p>
                  <p><em>${escapeHtml(q.feedback)}</em></p>
                </div>
              `)
              .join("")}
          ` : ""}

          ${suggestions.length ? `
            <h2>Improvement Suggestions</h2>
            <ul>
              ${suggestions.map((s: any) => `<li>${escapeHtml(s)}</li>`).join("")}
            </ul>
          ` : ""}

          ${transcript.length ? `
            <h2>Interview Transcript</h2>
            ${transcript
              .map((t: any, i: number) => `
                <div class="transcript-item">
                  <strong>Question ${i + 1}</strong>
                  <p>${escapeHtml(t.question)}</p>
                  <strong>Answer</strong>
                  <p>${escapeHtml(t.answer)}</p>
                </div>
              `)
              .join("")}
          ` : ""}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      executablePath: puppeteer.executablePath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      headless: true,
      defaultViewport: { width: 1200, height: 800 },
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=Interview_Report.pdf",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse("PDF generation failed.", { status: 500 });
  }
}
