import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import os from "os";

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

    // Find a usable browser executable. Prefer env vars, then common locations, then puppeteer's builtin.
    function findBrowserExecutable() {
      const tried: string[] = [];

      const envCandidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.EDGE_PATH,
        process.env.CHROME_PATH,
      ].filter(Boolean) as string[];

      for (const p of envCandidates) {
        tried.push(p);
        try {
          if (fs.existsSync(p)) return { path: p, tried };
        } catch {}
      }

      const platform = os.platform();
      const common: string[] = [];

      if (platform === "win32") {
        common.push(
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
        );
      } else if (platform === "darwin") {
        common.push(
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        );
      } else {
        // linux
        common.push(
          "/usr/bin/microsoft-edge",
          "/usr/bin/microsoft-edge-stable",
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium"
        );
      }

      for (const p of common) {
        tried.push(p);
        try {
          if (fs.existsSync(p)) return { path: p, tried };
        } catch {}
      }

      // Finally, try puppeteer's executable path if available
      try {
        const pupPath = typeof puppeteer.executablePath === "function" ? puppeteer.executablePath() : undefined;
        if (pupPath) {
          tried.push(pupPath);
          if (fs.existsSync(pupPath)) return { path: pupPath, tried };
        }
      } catch (e) {
        // ignore
      }

      return { path: undefined, tried };
    }

    const { path: foundPath, tried } = findBrowserExecutable();

    const launchOptions: any = {
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      headless: true,
      defaultViewport: { width: 1200, height: 800 },
    };

    if (foundPath) {
      launchOptions.executablePath = foundPath;
      console.log("Using browser executable:", foundPath);
    } else {
      console.warn("No browser executable found from env or common paths. Will attempt Puppeteer's default.", tried);
    }

    let browser;
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchErr) {
      const errMsg = (launchErr as any)?.message ?? String(launchErr);
      const msg = `Failed to launch browser. Tried: ${tried.join(", ")}. Error: ${errMsg}`;
      console.error(msg, launchErr);
      return new NextResponse(`PDF generation failed: ${msg}`, { status: 500, headers: { "Content-Type": "text/plain;charset=utf-8" } });
    }

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
    const message = error instanceof Error ? error.message : String(error);
    console.error("PDF generation error:", message, error);
    return new NextResponse(`PDF generation failed: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });
  }
}
