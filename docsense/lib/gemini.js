const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const BLOCKED_PATTERNS = [
  /how to (hack|exploit|bypass)/i,
  /(weapon|bomb|attack) (instruction|guide|tutorial)/i,
  /credit card number|social security/i,
];

export function isQuestionSafe(question) {
  return !BLOCKED_PATTERNS.some((p) => p.test(question));
}

export function redactPII(text) {
  return text
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL REDACTED]")
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE REDACTED]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN REDACTED]")
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[CARD REDACTED]");
}

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

function findBestMatchingPage(answer, pages) {
  const meaningfulWords = answer.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
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

export function extractCitation(answer, docText, isDocumentAnswer) {
  if (!isDocumentAnswer) return null;
  const explicit = answer.match(/Page (\d+)/i);
  if (explicit) return `Page ${explicit[1]}`;
  const pages = splitIntoPages(docText);
  if (pages.length === 0) return null;
  const best = findBestMatchingPage(answer, pages);
  return best ? `Page ${best}` : null;
}

export async function askGemini(question, docText, docName) {
  if (!isQuestionSafe(question)) {
    return {
      answer: "I can't help with that kind of question. Please ask something related to your document.",
      citation: null,
      confidence: 0,
    };
  }

  const maxDocLength = 30000;
  const truncatedDoc = docText.length > maxDocLength
    ? docText.slice(0, maxDocLength) + "\n[...document truncated]"
    : docText;

  const prompt = `You are DocSense, a warm and helpful AI assistant that primarily answers questions about the user's uploaded document. You are conversational but focused.

YOUR BEHAVIOR:

1. **DOCUMENT QUESTIONS** — If the user asks something that can be answered from the document:
   - Answer ONLY from the document. Do not use outside knowledge.
   - Cite the page number (e.g., "Page 2").
   - Mark this answer as TYPE: DOCUMENT
   - Keep answers concise — 2-4 sentences.

2. **GREETINGS / SMALL TALK** (e.g., "hi", "hello", "how are you", "thanks", "bye"):
   - Respond warmly and briefly (1-2 sentences).
   - Gently invite them to ask about the document.
   - Mark this answer as TYPE: CHAT

3. **OFF-TOPIC OR PERSONAL** (e.g., "I'm not feeling well", "I'm tired", "what's the weather"):
   - Acknowledge them empathetically in 1 sentence.
   - Politely redirect: ask if there's anything about the document they'd like to know.
   - Mark this answer as TYPE: CHAT

4. **TYPOS / UNCLEAR QUESTIONS** — Try to interpret what they meant. If genuinely unclear, ask a brief clarifying question. Mark TYPE: CHAT.

5. **OUT-OF-SCOPE DOCUMENT QUESTIONS** — If the question is about the document but the answer isn't in it:
   - Say "I couldn't find that in this document." in 1 sentence.
   - Suggest what kind of questions you CAN answer based on the document.
   - Mark TYPE: NOT_FOUND

OUTPUT FORMAT — every response must end with two lines:
TYPE: [DOCUMENT|CHAT|NOT_FOUND]
CONFIDENCE: [0.0 to 1.0]

---

DOCUMENT (${docName || "untitled"}):
${truncatedDoc}

USER MESSAGE: ${question}

YOUR RESPONSE:`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Gemini API error");
  }

  const data = await res.json();
  let rawAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

  // Parse the TYPE
  let answerType = "CHAT";
  const typeMatch = rawAnswer.match(/TYPE:\s*(DOCUMENT|CHAT|NOT_FOUND)/i);
  if (typeMatch) {
    answerType = typeMatch[1].toUpperCase();
    rawAnswer = rawAnswer.replace(/TYPE:\s*(DOCUMENT|CHAT|NOT_FOUND)/i, "").trim();
  }

  // Parse confidence
  let confidence = 0.8;
  const confMatch = rawAnswer.match(/CONFIDENCE:\s*([\d.]+)/i);
  if (confMatch) {
    confidence = Math.min(1, Math.max(0, parseFloat(confMatch[1])));
    rawAnswer = rawAnswer.replace(/CONFIDENCE:\s*[\d.]+/i, "").trim();
  }

  const safeAnswer = redactPII(rawAnswer);

  // Only show citation + confidence for actual document answers
  const isDocumentAnswer = answerType === "DOCUMENT";
  const citation = extractCitation(safeAnswer, docText, isDocumentAnswer);

  return {
    answer: safeAnswer,
    citation,
    confidence: isDocumentAnswer ? confidence : undefined,
  };
}
