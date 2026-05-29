import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============ SAFETY: Block harmful questions ============
const BLOCKED_PATTERNS = [
  /how to (hack|exploit|bypass)/i,
  /(weapon|bomb|attack) (instruction|guide|tutorial)/i,
  /credit card number|social security/i,
];

function isQuestionSafe(question) {
  return !BLOCKED_PATTERNS.some((p) => p.test(question));
}

// ============ SAFETY: Hide personal info in AI responses ============
function redactPII(text) {
  return text
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL REDACTED]")
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE REDACTED]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN REDACTED]")
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[CARD REDACTED]");
}

// ============ CITATIONS: Find which page the answer came from ============

// Split the document text into [{ num, text }] using "--- Page N ---" markers
function splitIntoPages(docText) {
  const pages = [];
  const regex = /--- Page (\d+) ---/g;
  let prevIndex = 0;
  let prevPageNum = null;
  let match;

  while ((match = regex.exec(docText)) !== null) {
    if (prevPageNum !== null) {
      pages.push({ num: prevPageNum, text: docText.slice(prevIndex, match.index) });
    }
    prevPageNum = match[1];
    prevIndex = match.index + match[0].length;
  }
  if (prevPageNum !== null) {
    pages.push({ num: prevPageNum, text: docText.slice(prevIndex) });
  }
  return pages;
}

// Score each page by how many of the answer's meaningful words appear in it.
// Highest score wins → that's our best-guess source page.
function findBestMatchingPage(answer, pages) {
  const meaningfulWords = answer
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);

  let bestPage = null;
  let bestScore = 0;

  for (const page of pages) {
    const pageLower = page.text.toLowerCase();
    let score = 0;
    for (const word of meaningfulWords) {
      if (pageLower.includes(word)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestPage = page.num;
    }
  }

  return bestPage;
}

function extractCitation(answer, docText) {
  // 1. If Gemini explicitly mentioned a page, use that
  const explicit = answer.match(/Page (\d+)/i);
  if (explicit) return `Page ${explicit[1]}`;

  // 2. Otherwise, find the page with most word overlap
  const pages = splitIntoPages(docText);
  if (pages.length === 0) return null;

  const best = findBestMatchingPage(answer, pages);
  return best ? `Page ${best}` : null;
}

// ============ MAIN HANDLER ============

export async function POST(request) {
  try {
    const { question, docText, docName, userId } = await request.json();

    if (!question || !docText) {
      return NextResponse.json(
        { error: "Missing question or document text." },
        { status: 400 }
      );
    }

    // Safety check on input
    if (!isQuestionSafe(question)) {
      return NextResponse.json({
        answer:
          "I can't help with that kind of question. Please ask something related to your document.",
        citation: null,
        confidence: 0,
      });
    }

    // Truncate long documents (Gemini context limit)
    const maxDocLength = 30000;
    const truncatedDoc =
      docText.length > maxDocLength
        ? docText.slice(0, maxDocLength) + "\n[...document truncated]"
        : docText;

    // RAG prompt: answer ONLY from the document
    const prompt = `You are DocSense, an AI assistant that answers questions strictly based on the provided document.

RULES:
1. Answer ONLY from the document below. Do not use outside knowledge.
2. If the answer isn't in the document, say "I couldn't find that in this document."
3. Cite the page number in your answer (e.g., "Page 2").
4. At the end, on a new line, write: CONFIDENCE: X (0.0 to 1.0).
5. Keep answers concise — 2-4 sentences max.

DOCUMENT (${docName || "untitled"}):
${truncatedDoc}

QUESTION: ${question}

ANSWER:`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    });

    const result = await model.generateContent(prompt);
    let rawAnswer = result.response.text();

    // Extract confidence score
    let confidence = 0.8;
    const confMatch = rawAnswer.match(/CONFIDENCE:\s*([\d.]+)/i);
    if (confMatch) {
      confidence = Math.min(1, Math.max(0, parseFloat(confMatch[1])));
      rawAnswer = rawAnswer.replace(/CONFIDENCE:\s*[\d.]+/i, "").trim();
    }

    const safeAnswer = redactPII(rawAnswer);
    const citation = extractCitation(safeAnswer, docText);

    return NextResponse.json({
      answer: safeAnswer,
      citation,
      confidence,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
