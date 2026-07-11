import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, query, orderBy } from "firebase/firestore";

export const APTITUDE_CATEGORIES = ["Quantitative", "Logical", "Verbal"];

export async function fetchAptitudeTopics() {
  const snap = await getDocs(query(collection(db, "aptitude_topics"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchTopicQuestions(topicId) {
  const snap = await getDocs(query(collection(db, "aptitude_topics", topicId, "questions"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchTopicWithQuestions(topicId) {
  const topicSnap = await getDoc(doc(db, "aptitude_topics", topicId));
  if (!topicSnap.exists()) return null;
  const questions = await fetchTopicQuestions(topicId);
  return { id: topicSnap.id, ...topicSnap.data(), questions };
}

export function groupTopicsByCategory(topics) {
  const grouped = {};
  for (const cat of APTITUDE_CATEGORIES) grouped[cat] = [];
  for (const t of topics) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }
  return grouped;
}

export function topicAccuracy(topicStats, topicId) {
  const s = topicStats?.[topicId];
  if (!s || !s.attempted) return null;
  return Math.round((s.correct / s.attempted) * 100);
}
