# DocSense

AI-powered document Q&A with built-in voice accessibility. Sign in with Google, upload your documents, and ask questions in the chatbox.

## Features

- **Google Sign-In**: Secure authentication powered by Firebase Auth
- **Upload and chat with documents**: Drop in a PDF and ask anything about its content
- **Voice accessibility**: Users can read or listen to the answers
- **RAG-powered answers**: Retrieval-Augmented Generation grounds every response in your actual document
- **Fast, streaming responses**: Answers stream in token by token
- **Clean, responsive UI**: Works on desktop and mobile

## Tech Stack

- **Framework:** Next.js (App Router)
- **Auth & Backend:** Firebase (Google Authentication, Firestore)
- **LLM:** Google Gemini
- **Voice:** Web Speech API (speech to text and text to speech)
- **Deployment:** Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Firebase project with Google Auth enabled
- A Google Gemini API key

### Installation

```bash
git clone https://github.com/Fatima-Shahid11/docSense.git
cd docSense/docsense
npm install
cp .env.example .env.local
```

Add your keys to `.env.local`:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# LLM
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

### Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Sign in**: User signs in with Google via Firebase Auth
2. **Upload**: User uploads a PDF
3. **Parse and chunk**: Document is split into overlapping chunks
4. **Ask**: User asks a question (typed or spoken)
5. **Retrieve**: Most relevant chunks are pulled as context
6. **Answer**: Context plus question are sent to Gemini, and the response is streamed back (and optionally read aloud)
