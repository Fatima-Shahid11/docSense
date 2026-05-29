"use client";
import { useState, useRef } from "react";

export default function PdfUploader({ docText, docName, setDocText, setDocName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const extractPdfText = async (file) => {
    setLoading(true);
    setError("");
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += `\n\n--- Page ${i} ---\n${pageText}`;
      }
      const trimmed = fullText.trim();
      if (trimmed.length < 50) {
        setError("This PDF appears to be scanned (image-based). Try a text-based PDF instead.");
        return;
      }
      setDocText(trimmed);
      setDocName(file.name);
    } catch (err) {
      console.error("PDF extraction failed:", err);
      setError("Failed to read PDF. Please try a different file.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Please upload a PDF file.");
    if (file.size > 10 * 1024 * 1024) return setError("File too large. Max 10 MB.");
    extractPdfText(file);
  };

  const handleClear = () => {
    setDocText("");
    setDocName("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-teal-100 p-6 border border-teal-100">
      <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-teal-200">
          <span className="text-base">📤</span>
        </span>
        Upload Document
      </h2>

      {!docName ? (
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer block border-2 border-dashed border-teal-300 bg-teal-50/50 rounded-2xl p-8 text-center hover:border-teal-500 hover:bg-teal-50 transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
            aria-label="Upload PDF file"
            disabled={loading}
          />
          <div className="text-5xl mb-3">📄</div>
          <div className="text-slate-800 font-bold mb-1 text-sm">
            {loading ? "Reading PDF..." : "Click to upload a PDF"}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Max 10 MB · Text-based PDFs only
          </div>
        </label>
      ) : (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-300 rounded-xl p-3 flex items-start justify-between gap-3 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-teal-900 text-sm truncate flex items-center gap-1.5">
                <span className="text-teal-600">✓</span>
                <span className="truncate">{docName}</span>
              </div>
              <div className="text-xs text-teal-700 mt-0.5 font-medium">
                {docText.length.toLocaleString()} characters extracted
              </div>
            </div>
            <button
              onClick={handleClear}
              type="button"
              className="cursor-pointer shrink-0 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition font-medium"
              aria-label="Remove document"
              title="Remove document"
            >
              ✕
            </button>
          </div>

          <details className="text-sm bg-teal-50/50 rounded-xl border border-teal-200">
            <summary className="cursor-pointer text-slate-700 hover:text-teal-700 font-semibold px-3 py-2 text-xs">
              Preview extracted text
            </summary>
            <div className="p-3 text-xs text-slate-700 max-h-60 overflow-y-auto whitespace-pre-wrap border-t border-teal-200 bg-white rounded-b-xl">
              {docText.slice(0, 2000)}
              {docText.length > 2000 && (
                <div className="text-slate-400 mt-2 italic">
                  ... and {(docText.length - 2000).toLocaleString()} more characters
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-red-800 bg-red-50 p-3 rounded-xl border border-red-200 break-words leading-relaxed font-medium">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
