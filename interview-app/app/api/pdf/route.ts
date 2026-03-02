import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { results = {} } = body;

    /* ===========================
       SAFE DATA DEFAULTS
    =========================== */

    const score = results.totalScore ?? results.score ?? 0;
    const feedback = results.feedback ?? "No feedback provided.";
    const teacherSummary = results.teacherSummary ?? "";

    const questionsHTML =
      results.questions?.length
        ? `
          <h2>Question-by-Question Evaluation</h2>
          ${results.questions
            .map(
              (q: any, i: number) => `
            <div class="question">
              <strong>Question ${i + 1} (${q.score ?? 0}/${q.maxScore ?? 0})</strong>
              <p>${q.question ?? ""}</p>
              <p><em>${q.feedback ?? ""}</em></p>
            </div>
          `
            )
            .join("")}
        `
        : "";

    const suggestionsHTML =
      results.suggestions?.length
        ? `
          <h2>Improvement Suggestions</h2>
          <ul>
            ${results.suggestions
              .map((s: string) => `<li>${s}</li>`)
              .join("")}
          </ul>
        `
        : "";

    const transcriptHTML =
      results.transcript?.length
        ? results.transcript
            .map(
              (t: any, i: number) => `
          <div class="transcript-item">
            <strong>Question ${i + 1}</strong>
            <p>${t.question ?? ""}</p>
            <strong>Answer</strong>
            <p>${t.answer ?? ""}</p>
          </div>
        `
            )
            .join("")
        : "<p>No transcript available.</p>";

    /* ===========================
       HTML TEMPLATE
    =========================== */

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
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
            <div class="score">${score}%</div>
          </div>

          <h2>Overall Feedback</h2>
          <p>${feedback}</p>

          ${
            teacherSummary
              ? `
            <h2>Teacher Summary</h2>
            <p>${teacherSummary}</p>
          `
              : ""
          }

          ${questionsHTML}
          ${suggestionsHTML}

          <h2>Interview Transcript</h2>
          ${transcriptHTML}
        </body>
      </html>
    `;

    /* ===========================
       LAUNCH CHROMIUM (VERCEL SAFE)
    =========================== */

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "40px",
        bottom: "40px",
        left: "40px",
        right: "40px",
      },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "attachment; filename=Interview_Report.pdf",
      },
    });
  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);

    return NextResponse.json(
      { error: "Failed to Generate PDF" },
      { status: 500 }
    );
  }
}