import { useEffect, useState } from "react";
import { db, collection, query, where, onSnapshot, updateDoc, doc } from "../firebase";
import "../styles/Admin.css";

export default function Admin() {
  const [pendingSummaries, setPendingSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState({}); 

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "summaries"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      setPendingSummaries(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleAction(summaryId, newStatus) {
    setLoading(true);
    const feedback = feedbacks[summaryId] || "";
    await updateDoc(doc(db, "summaries", summaryId), {
      status: newStatus,
      adminComment: feedback,
      reviewedAt: new Date(),
    });
    setLoading(false);
  }

  return (
    <section className="admin-section max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-8 text-center">Admin Panel – Summaries Approval</h1>
      {loading && <div className="text-center py-8">Loading...</div>}
      {!loading && pendingSummaries.length === 0 && (
        <div className="text-center text-gray-500 py-8">No summaries pending approval 🎉</div>
      )}
      <div className="grid gap-6">
        {pendingSummaries.map((summary) => (
          <div className="card relative" key={summary.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold text-blue-700">Title:</span>
              <span className="text-lg">{summary.title || "(No Title)"}</span>
              <span className="ml-auto text-sm text-gray-400">
                by {summary.ownerName || summary.owner || "Unknown"}
              </span>
            </div>
            <div className="mb-3">
              <span className="font-semibold text-blue-700">Summary:</span>
              <div className="bg-gray-50 rounded p-3 mt-1 text-sm max-h-40 overflow-auto">{summary.content || "[No Content]"}</div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-semibold mb-1">Feedback (optional):</label>
              <textarea
                className="input-field w-full border border-gray-300 rounded px-3 py-2 min-h-[40px] focus:ring focus:ring-blue-200"
                value={feedbacks[summary.id] || ""}
                onChange={e =>
                  setFeedbacks((prev) => ({ ...prev, [summary.id]: e.target.value }))
                }
                placeholder="Feedback to the user (optional)..."
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="btn-primary bg-green-600 hover:bg-green-700"
                onClick={() => handleAction(summary.id, "approved")}
                disabled={loading}
              >
                Approve
              </button>
              <button
                className="btn-primary bg-red-500 hover:bg-red-700"
                onClick={() => handleAction(summary.id, "rejected")}
                disabled={loading}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}