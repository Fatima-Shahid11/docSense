"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatBox({ docText, docName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const speakAnswer = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const cleanText = text.replace(/[*_`#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question) return;
    if (!docText) {
      alert("Please upload a document first.");
      return;
    }
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, docText, docName, userId: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
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

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-teal-100 flex flex-col h-[600px] border border-teal-100">
      <div className="px-4 py-3 border-b border-teal-100 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md shadow-cyan-200">
            <span className="text-base">💬</span>
          </span>
          Ask Questions
        </h2>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 select-none cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={voiceOutput}
            onChange={(e) => setVoiceOutput(e.target.checked)}
            className="w-3.5 h-3.5 accent-teal-600 cursor-pointer"
            aria-label="Enable voice output"
          />
          🔊 Speak answers
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-teal-50/30">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-12">
            {docName ? (
              <>
                <div className="text-4xl mb-2">💭</div>
                <p className="text-sm font-medium text-slate-600">
                  Ask anything about <strong className="text-teal-700">{docName}</strong>
                </p>
                <p className="text-xs mt-2 text-slate-400">Try: "What is this document about?"</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">📤</div>
                <p className="text-sm font-medium text-slate-600">Upload a document to start asking questions</p>
              </>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 break-words ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-br-sm"
                  : msg.error
                  ? "bg-red-50 text-red-900 border border-red-200 rounded-bl-sm"
                  : "bg-white text-slate-800 border border-teal-200 rounded-bl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {msg.error && "⚠️ "}{msg.content}
              </div>
              {msg.citation && (
                <div className={`text-xs mt-2 pt-2 border-t font-semibold ${
                  msg.role === "user" ? "border-white/30 opacity-90" : "border-teal-100 text-teal-600"
                }`}>
                  📎 {msg.citation}
                </div>
              )}
              {msg.confidence !== undefined && !msg.error && (
                <div className={`text-xs mt-1 ${msg.role === "user" ? "opacity-75" : "text-slate-400"}`}>
                  Confidence: {Math.round(msg.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-teal-200 text-slate-500 rounded-2xl px-4 py-2.5 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-teal-100 bg-white rounded-b-2xl">
        <div className="flex gap-2 items-stretch">
          <button
            onClick={toggleVoiceInput}
            disabled={loading}
            type="button"
            className={`cursor-pointer disabled:cursor-not-allowed px-3 rounded-xl border transition shrink-0 flex items-center justify-center ${
              listening
                ? "bg-red-500 text-white border-red-500 animate-pulse"
                : "bg-white text-teal-600 hover:bg-teal-50 hover:text-teal-700 border-teal-300"
            }`}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            title={listening ? "Stop listening" : "Click to speak"}
          >
            🎤
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "Listening..." : "Ask a question..."}
            disabled={loading}
            rows={1}
            className="flex-1 resize-none border border-teal-200 bg-white rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400 text-sm transition"
            aria-label="Question input"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            type="button"
            className="cursor-pointer disabled:cursor-not-allowed bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-slate-300 disabled:to-slate-300 text-white px-5 rounded-xl font-semibold transition shrink-0 text-sm flex items-center justify-center"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
