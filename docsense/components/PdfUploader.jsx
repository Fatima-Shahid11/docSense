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
        setError("This PDF appears to be scanned (image-based). Try a text-based PDF.");
        return;
      }
      await saveDocument(user.uid, file.name, trimmed);
      setDocText(trimmed);
      setDocName(file.name);
      await loadDocs();
    } catch (err) {
      console.error("PDF upload failed:", err);
      setError("Failed to upload: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Please upload a PDF file.");
    if (file.size > 1 * 1024 * 1024) return setError("File too large. Max 1 MB.");
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
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Documents</h2>
        <span className="text-sm text-slate-600 font-medium">{savedDocs.length} saved</span>
      </div>

      {/* Upload button */}
      <label
        htmlFor="pdf-upload"
        className={`block w-full rounded-xl border-2 border-dashed transition-all text-center p-5 group ${
          loading
            ? "border-indigo-500/40 bg-indigo-500/5 cursor-wait"
            : "border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5 cursor-pointer"
        }`}
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
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm text-indigo-400 font-medium">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-indigo-500/10 border border-slate-700 group-hover:border-indigo-500/30 flex items-center justify-center transition-all">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300 group-hover:text-indigo-300 transition-colors">Upload PDF</p>
              <p className="text-sm text-slate-600 mt-0.5">Max 1 MB · Text-based only</p>
            </div>
          </div>
        )}
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 leading-relaxed">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-700/50" />

      {/* Document list */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1.5">
        {loadingList ? (
          <div className="flex flex-col gap-2 mt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : savedDocs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">No documents yet</p>
            <p className="text-sm text-slate-600">Upload a PDF to get started</p>
          </div>
        ) : (
          savedDocs.map((savedDoc) => {
            const isActive = docName === savedDoc.name;
            return (
              <div
                key={savedDoc.id}
                onClick={() => handleSelectDoc(savedDoc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleSelectDoc(savedDoc)}
                className={`w-full text-left rounded-xl p-3 flex items-start justify-between gap-2 transition-all border group cursor-pointer ${
                  isActive
                    ? "bg-indigo-500/10 border-indigo-500/30"
                    : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600/60"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-indigo-500/20" : "bg-slate-700/60"
                  }`}>
                    <svg className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate leading-tight ${isActive ? "text-indigo-300" : "text-slate-200"}`}>
                      {savedDoc.name}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {savedDoc.characterCount?.toLocaleString() || 0} chars
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteDoc(savedDoc, e)}
                  type="button"
                  className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all mt-0.5"
                  aria-label={`Delete ${savedDoc.name}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
