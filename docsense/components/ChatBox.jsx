"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { askGemini } from "@/lib/gemini";

export default function ChatBox({ docText, docName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMessages([]);
  }, [docName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakAnswer = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const cleanText = text.replace(/[*_`#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || !docText || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const data = await askGemini(question, docText, docName);
      const aiMessage = {
        role: "assistant",
        content: data.answer,
        citation: data.citation,
        confidence: data.confidence,
      };
      setMessages((prev) => [...prev, aiMessage]);
      if (voiceOutput) speakAnswer(data.answer);
    } catch (err) {
      console.error(err);
      let shortError = err.message;
      if (shortError.length > 180) shortError = shortError.slice(0, 180) + "...";
      setMessages((prev) => [...prev, { role: "assistant", content: shortError, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const hasDoc = !!docText;
  const canSend = !loading && hasDoc && input.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Chat header */}
      <div className="shrink-0 h-14 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950">
        <div className="flex items-center gap-2.5 min-w-0">
          {hasDoc ? (
            <>
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 shrink-0" />
              <span className="text-base font-semibold text-slate-200 truncate">{docName}</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-slate-700 rounded-full shrink-0" />
              <span className="text-base text-slate-500">No document selected</span>
            </>
          )}
        </div>
        {/* Voice toggle */}
        <button
          type="button"
          onClick={() => setVoiceOutput((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all border ${
            voiceOutput
              ? "text-indigo-300 bg-indigo-500/10 border-indigo-500/30"
              : "text-slate-500 bg-transparent border-slate-700/60 hover:border-slate-600 hover:text-slate-400"
          }`}
          aria-label={voiceOutput ? "Disable voice output" : "Enable voice output"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {voiceOutput ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </svg>
          {voiceOutput ? "Voice on" : "Voice off"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-16">
            {hasDoc ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-300 mb-1">
                  Ask anything about this document
                </p>
                <p className="text-sm text-slate-600 mb-6">
                  Powered by Gemini AI
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                  {["What is this document about?", "Summarize the key points", "What are the main conclusions?"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                      className="text-sm text-slate-400 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-lg px-3 py-1.5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-400 mb-1">No document selected</p>
                <p className="text-sm text-slate-600">Upload or select a document from the sidebar</p>
              </>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mr-2.5 mt-0.5 shadow shadow-indigo-900/60">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === "user" ? "order-first" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-base leading-relaxed break-words ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-indigo-900/40"
                    : msg.error
                    ? "bg-red-500/10 text-red-300 border border-red-500/20 rounded-tl-sm"
                    : "bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.citation && (
                  <div className={`mt-2.5 pt-2.5 border-t text-sm font-medium flex items-center gap-1.5 ${
                    msg.role === "user" ? "border-white/20 text-indigo-200" : "border-slate-700 text-slate-500"
                  }`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                    {msg.citation}
                  </div>
                )}
                {msg.confidence !== undefined && msg.confidence < 1 && !msg.error && (
                  <div className={`mt-1.5 text-sm ${msg.role === "user" ? "text-indigo-200/70" : "text-slate-600"}`}>
                    {Math.round(msg.confidence * 100)}% confidence
                  </div>
                )}
              </div>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ml-2.5 mt-0.5 ring-2 ring-indigo-500/20">
                <img
                  src={user?.photoURL}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mr-2.5 mt-0.5 shadow shadow-indigo-900/60">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 p-4 border-t border-slate-800/80 bg-slate-950">
        <div className="flex items-end gap-2 bg-slate-800/80 border border-slate-700/50 rounded-2xl px-3 py-2.5 focus-within:border-indigo-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={hasDoc ? `Ask about ${docName}...` : "Select a document to start asking questions"}
            disabled={!hasDoc || loading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-base text-slate-200 placeholder-slate-600 focus:outline-none disabled:cursor-not-allowed leading-relaxed py-0.5 max-h-[120px] overflow-y-auto pl-2"
            aria-label="Question input"
            style={{ height: "auto" }}
          />
          <button
            onClick={sendMessage}
            disabled={!canSend}
            type="button"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-600 text-white transition-all shadow shadow-indigo-900/40 disabled:shadow-none"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-700 mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
