"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PdfUploader from "@/components/PdfUploader";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const [docText, setDocText] = useState("");
  const [docName, setDocName] = useState("");

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-teal-50">
        <div className="text-teal-700 text-sm animate-pulse font-medium">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-100 via-cyan-100 to-emerald-100">
        <div className="bg-white rounded-3xl shadow-2xl shadow-teal-200 p-10 max-w-md w-full text-center border border-teal-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-3xl mb-5 shadow-lg shadow-teal-300">
            <span className="text-4xl">📄</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            DocSense
          </h1>
          <p className="text-slate-600 text-sm mb-8 font-medium">
            AI-powered document Q&A. Private, fast, and secure.
          </p>

          <button
            onClick={login}
            type="button"
            className="cursor-pointer w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 transition shadow-lg shadow-teal-300 hover:shadow-xl hover:shadow-teal-400 text-sm"
            aria-label="Sign in with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
      <header className="bg-white border-b-2 border-teal-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-teal-300">
              <span className="text-base">📄</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              DocSense
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-7 h-7 rounded-full ring-2 ring-teal-300"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs text-slate-800 hidden sm:block font-semibold">
              {user.displayName}
            </span>
            <button
              onClick={logout}
              type="button"
              className="cursor-pointer text-xs text-slate-600 hover:text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid md:grid-cols-2 gap-4">
        <PdfUploader docText={docText} docName={docName} setDocText={setDocText} setDocName={setDocName} />
        <ChatBox docText={docText} docName={docName} />
      </div>
    </main>
  );
}
