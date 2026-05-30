"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { saveDocument, listDocuments, deleteDocument } from "@/lib/documents";

export default function PdfUploader({ docText, docName, setDocText, setDocName }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedDocs, setSavedDocs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const fileInputRef = useRef(null);

  // Load saved documents on mount and when user changes
  useEffect(() => {
    if (!user?.uid) {
      setSavedDocs([]);
      setLoadingList(false);
      return;
    }
    loadDocs();
  }, [user]);

  const loadDocs = async () => {
    setLoadingList(true);
    try {
      const docs = await listDocuments(user.uid);
      setSavedDocs(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoadingList(false);
    }
  };

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
      // Save to Firestore
      await saveDocument(user.uid, file.name, trimmed);
      // Set as active
      setDocText(trimmed);
      setDocName(file.name);
      // Refresh the list
      await loadDocs();
    } catch (err) {
      console.error("PDF upload failed:", err);
      setError("Failed to upload PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Please upload a PDF file.");
    if (file.size > 1 * 1024 * 1024) return setError("File too large. Max 1 MB (Firestore document limit).");
    extractPdfText(file);
  };

  const handleSelectDoc = (savedDoc) => {
    setDocText(savedDoc.text);
    setDocName(savedDoc.name);
    setError("");
  };

  const handleDeleteDoc = async (savedDoc, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${savedDoc.name}"?`)) return;
    try {
      await deleteDocument(user.uid, savedDoc.id);
      if (docName === savedDoc.name) {
        setDocText("");
        setDocName("");
      }
      await loadDocs();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-teal-100 p-6 border border-teal-100">
      <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-teal-200">
          <span className="text-base">📤</span>
        </span>
        Your Documents
      </h2>

      {/* Upload area */}
      <label
        htmlFor="pdf-upload"
        className="cursor-pointer block border-2 border-dashed border-teal-300 bg-teal-50/50 rounded-2xl p-6 text-center hover:border-teal-500 hover:bg-teal-50 transition mb-4"
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
        <div className="text-3xl mb-2">📄</div>
        <div className="text-slate-800 font-bold mb-1 text-sm">
          {loading ? "Uploading..." : "Upload a PDF"}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Max 1 MB · Text-based PDFs only
        </div>
      </label>

      {/* Saved documents list */}
      <div>
        <h3 className="text-xs font-bold text-slate-600 uppercase mb-2 tracking-wide">
          Saved ({savedDocs.length})
        </h3>

        {loadingList ? (
          <div className="text-xs text-slate-500 text-center py-3">Loading...</div>
        ) : savedDocs.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-3 italic">
            No documents yet. Upload one to get started.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {savedDocs.map((savedDoc) => {
              const isActive = docName === savedDoc.name;
              return (
                <div
                  key={savedDoc.id}
                  onClick={() => handleSelectDoc(savedDoc)}
                  className={`cursor-pointer rounded-xl p-3 flex items-start justify-between gap-2 transition border ${
                    isActive
                      ? "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-400 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-teal-50/50 hover:border-teal-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm truncate font-medium flex items-center gap-1.5 ${
                      isActive ? "text-teal-900" : "text-slate-800"
                    }`}>
                      {isActive && <span className="text-teal-600">●</span>}
                      <span className="truncate">{savedDoc.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {savedDoc.characterCount?.toLocaleString() || 0} characters
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDoc(savedDoc, e)}
                    type="button"
                    className="cursor-pointer shrink-0 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition"
                    aria-label={`Delete ${savedDoc.name}`}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-800 bg-red-50 p-3 rounded-xl border border-red-200 break-words leading-relaxed font-medium">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
