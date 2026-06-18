"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PdfUploader from "@/components/PdfUploader";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  const { user, loading, login, logout, signingIn, signingOut } = useAuth();
  const [docText, setDocText] = useState("");
  const [docName, setDocName] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-slate-500 text-base">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
        </div>
        <div className="relative bg-slate-900 border border-slate-700/50 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl shadow-black/50">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mb-6 shadow-xl shadow-indigo-900/60">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">DocSense</h1>
          <p className="text-slate-400 text-base mb-8 leading-relaxed">
            AI-powered document Q&amp;A.<br />Private, fast, and secure.
          </p>
          <button
            onClick={login}
            disabled={signingIn}
            type="button"
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-900/40 text-base"
            aria-label="Sign in with Google"
          >
            {signingIn ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {signingIn ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Topbar */}
      <header className="shrink-0 h-14 bg-slate-900 border-b border-slate-700/40 flex items-center justify-between px-5 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow shadow-indigo-900/60">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">DocSense</span>
        </div>

        <div className="flex items-center gap-3">
          {docName && (
            <span className="hidden sm:flex items-center gap-1.5 text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 font-medium max-w-[200px] truncate">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
              <span className="truncate">{docName}</span>
            </span>
          )}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen((o) => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-700/50 transition-colors"
              aria-haspopup="true"
              aria-expanded={accountOpen}
            >
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40"
                referrerPolicy="no-referrer"
              />
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                <div className="px-4 py-3.5 border-b border-slate-700/60 flex items-center gap-3">
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-200 truncate">{user.displayName}</p>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setAccountOpen(false); logout(); }}
                    disabled={signingOut}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                    </svg>
                    {signingOut ? "Signing out..." : "Log out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* App body */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-slate-700/40 overflow-y-auto bg-slate-900">
          <PdfUploader
            docText={docText}
            docName={docName}
            setDocText={setDocText}
            setDocName={setDocName}
          />
        </aside>
        <main className="flex-1 overflow-hidden">
          <ChatBox docText={docText} docName={docName} />
        </main>
      </div>
    </div>
  );
}
