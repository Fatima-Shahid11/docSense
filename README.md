# DocSense 📄🎙️

> AI-powered document Q&A with built-in voice accessibility. Ask questions about your documents and hear answers back.

🔗 **Live demo:** [docsense-rag.vercel.app](https://docsense-rag.vercel.app/)

## ✨ Features

- 📤 **Upload and chat with documents**: Drop in a PDF and ask anything about its content
- 🎙️ **Voice accessibility**: Ask questions by voice and listen to answers, making documents accessible to visually impaired users and hands-free workflows
- 🧠 **RAG-powered answers**: Retrieval-Augmented Generation grounds every response in your actual document, not hallucinated content
- ⚡ **Fast, streaming responses**: Answers stream in token by token
- 🎨 **Clean, responsive UI**: Works on desktop and mobile

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** JavaScript
- **LLM:** <OpenAI GPT-4o mini / Groq / etc.>
- **Embeddings + Vector Store:** <e.g. OpenAI embeddings + Pinecone / Supabase pgvector>
- **Document parsing:** <pdf-parse / LangChain loaders>
- **Voice:** Web Speech API (speech to text and text to speech)
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- API keys for your LLM and vector store

### Installation

```bash
git clone https://github.com/Fatima-Shahid11/docSense.git
cd docSense/docsense
npm install
cp .env.example .env.local
```

Add your keys to `.env.local`:
```env
OPENAI_API_KEY=your_key_here
# Add any other keys (vector DB, etc.)
```

### Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🧠 How It Works

1. **Upload**: User uploads a PDF
2. **Parse and chunk**: Document is split into overlapping chunks
3. **Embed and store**: Each chunk is embedded and saved to the vector store
4. **Ask**: User asks a question (typed or spoken)
5. **Retrieve**: Most relevant chunks are pulled from the vector store
6. **Answer**: Retrieved context plus question are sent to the LLM, and the response is streamed back (and optionally read aloud)

## 📂 Project Structure
