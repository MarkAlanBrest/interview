import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export const runtime = "nodejs";

type PdfQuestion = {
  question?: unknown;
  feedback?: unknown;
  score?: unknown;
  maxScore?: unknown;
};

type TranscriptItem = {
  question?: unknown;
  answer?: unknown;
};

type FontStyle = "normal" | "bold" | "italic" | "bolditalic";

function normalizeArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function textValue(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function addReportText(
  doc: jsPDF,
  text: unknown,
  y: number,
  options: {
    size?: number;
    style?: FontStyle;
    indent?: number;
    spacing?: number;
  } = {}
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const size = options.size ?? 11;
  const indent = options.indent ?? 0;
  const spacing = options.spacing ?? 1.25;
  const x = margin + indent;
  const maxWidth = pageWidth - margin * 2 - indent;

  doc.setFont("helvetica", options.style ?? "normal");
  doc.setFontSize(size);

  const lines = doc.splitTextToSize(textValue(text, " "), maxWidth) as string[];
  const lineHeight = size * spacing;

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.text(line, x, y);
    y += lineHeight;
  }

  return y;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;

  if (y > pageHeight - 90) {
    doc.addPage();
    y = margin;
  }

  y += 14;
  y = addReportText(doc, title, y, { size: 15, style: "bold", spacing: 1.1 });
  doc.setDrawColor(210, 210, 210);
  doc.line(margin, y + 2, doc.internal.pageSize.getWidth() - margin, y + 2);

  return y + 18;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const results = body?.results ?? {};
    const questions = normalizeArray<PdfQuestion>(results.questions);
    const suggestions = normalizeArray(results.suggestions);
    const transcript = normalizeArray<TranscriptItem>(results.transcript);

    const doc = new jsPDF({
      unit: "pt",
      format: "letter",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 56;

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Interview Evaluation Report", pageWidth / 2, y, { align: "center" });

    y += 38;
    doc.setTextColor(42, 122, 226);
    doc.setFontSize(34);
    doc.text(`${textValue(results.totalScore ?? results.score ?? 0)}%`, pageWidth / 2, y, {
      align: "center",
    });
    doc.setTextColor(40, 40, 40);

    y += 34;
    y = addSectionTitle(doc, "Overall Feedback", y);
    y = addReportText(doc, results.feedback || "No overall feedback was provided.", y);

    if (results.teacherSummary) {
      y = addSectionTitle(doc, "Teacher Summary", y);
      y = addReportText(doc, results.teacherSummary, y);
    }

    if (questions.length > 0) {
      y = addSectionTitle(doc, "Question-by-Question Evaluation", y);

      questions.forEach((question, index) => {
        y = addReportText(
          doc,
          `Question ${index + 1} (${textValue(question.score)} / ${textValue(question.maxScore)})`,
          y,
          { size: 12, style: "bold" }
        );
        y = addReportText(doc, question.question, y + 2, { indent: 12 });
        y = addReportText(doc, question.feedback, y + 2, { indent: 12, style: "italic" });
        y += 10;
      });
    }

    if (suggestions.length > 0) {
      y = addSectionTitle(doc, "Improvement Suggestions", y);

      suggestions.forEach((suggestion) => {
        y = addReportText(doc, `- ${textValue(suggestion)}`, y, { indent: 12 });
      });
    }

    if (transcript.length > 0) {
      y = addSectionTitle(doc, "Interview Transcript", y);

      transcript.forEach((item, index) => {
        y = addReportText(doc, `Question ${index + 1}`, y, { size: 12, style: "bold" });
        y = addReportText(doc, item.question, y + 2, { indent: 12 });
        y = addReportText(doc, "Answer", y + 6, { size: 12, style: "bold" });
        y = addReportText(doc, item.answer, y + 2, { indent: 12 });
        y += 10;
      });
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=Interview_Report.pdf",
        "Cache-Control": "no-store",
        "X-PDF-Generator": "jspdf",
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
