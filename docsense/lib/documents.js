import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// Save a document for the current user
export async function saveDocument(userId, docName, docText) {
  if (!userId) throw new Error("Not signed in");
  const docId = `${Date.now()}-${docName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const docRef = doc(db, "users", userId, "documents", docId);
  await setDoc(docRef, {
    name: docName,
    text: docText,
    characterCount: docText.length,
    createdAt: serverTimestamp(),
  });
  return docId;
}

// List all documents for the current user
export async function listDocuments(userId) {
  if (!userId) return [];
  const q = query(
    collection(db, "users", userId, "documents"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// Delete a specific document
export async function deleteDocument(userId, docId) {
  if (!userId) throw new Error("Not signed in");
  await deleteDoc(doc(db, "users", userId, "documents", docId));
}
