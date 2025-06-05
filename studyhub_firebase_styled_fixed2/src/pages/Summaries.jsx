import React, { useState, useEffect } from "react";
import "../styles/Summaries.css";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

export default function Summaries() {
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubAuth();
  }, []);

  // שליפת סיכומים והצגת ownerName שמור בכל סיכום
  useEffect(() => {
    if (!user) {
      setSummaries([]);
      return;
    }
    const qApproved = query(collection(db, "summaries"), where("status", "==", "approved"));
    const qMine = query(collection(db, "summaries"), where("owner", "==", user.uid));

    let approvedSummaries = [];
    let mineSummaries = [];
    function updateCombined() {
      const mineNotApproved = mineSummaries.filter((s) => s.status !== "approved");
      const all = [
        ...approvedSummaries,
        ...mineNotApproved.filter((m) => !approvedSummaries.some((a) => a.id === m.id)),
      ];
      all.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
      setSummaries(all);
    }
    const unsubApproved = onSnapshot(qApproved, (snap) => {
      approvedSummaries = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      updateCombined();
    });
    const unsubMine = onSnapshot(qMine, (snap) => {
      mineSummaries = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      updateCombined();
    });
    return () => {
      unsubApproved();
      unsubMine();
    };
  }, [user]);

  // הוספת סיכום חדש – דואג להוסיף גם ownerName
  const addSummary = async () => {
    if (!summaryTitle.trim() || !summaryText.trim()) {
      alert("Please fill in both title and content");
      return;
    }
    if (!user) return alert("You must be logged in");

    // שליפת שם תצוגה אמיתי מהטבלת users
    let ownerName = user.displayName;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().displayName) {
        ownerName = userDoc.data().displayName;
      }
    } catch { }

    await addDoc(collection(db, "summaries"), {
      owner: user.uid,
      ownerName: ownerName || user.email || "משתמש",
      title: summaryTitle,
      content: summaryText,
      status: "pending",
      createdAt: serverTimestamp ? serverTimestamp() : new Date(),
    });
    setSummaryTitle("");
    setSummaryText("");
  };

  const deleteSummary = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this summary?")) {
      await deleteDoc(doc(db, "summaries", id));
    }
  };

  const openSummary = (summary) => setSelectedSummary(summary);
  const closeSummary = () => setSelectedSummary(null);

  return (
    <section className="page-wrapper">
      <h1 className="page-title">סיכומים</h1>
      <div className="summary-form">
        <input
          type="text"
          placeholder="כותרת הסיכום..."
          value={summaryTitle}
          onChange={(e) => setSummaryTitle(e.target.value)}
          className="summary-title-input"
        />
        <textarea
          placeholder="כתוב כאן את תוכן הסיכום..."
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value)}
          className="summary-content-textarea"
        />
        <button className="btn-primary" onClick={addSummary}>
          הוסף סיכום
        </button>
      </div>
      <div className="summaries-list">
        {summaries.map((s) => (
          <div
            key={s.id}
            className="summary-list-item"
            onClick={() => openSummary(s)}
          >
            <div className="summary-list-content">
              <h3 className="summary-list-title">{s.title || "ללא כותרת"}</h3>
              <p className="summary-list-preview">
                {s.content && s.content.length > 100
                  ? s.content.substring(0, 100) + "..."
                  : s.content}
              </p>
              <div className="summary-list-footer flex flex-wrap gap-2 items-center justify-between">
                <span className={`summary-status ${s.status}`}>
                  {s.status === "approved"
                    ? "מאושר"
                    : s.status === "pending"
                    ? "בהמתנה"
                    : "נדחה"}
                </span>
                <span className="summary-owner text-xs text-[#206db0] font-semibold">
                  {s.ownerName ? `מאת: ${s.ownerName}` : ""}
                </span>
                {s.createdAt && (
                  <span className="summary-date">
                    {s.createdAt.toDate
                      ? s.createdAt.toDate().toLocaleDateString()
                      : new Date(s.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {user && s.owner === user.uid && (
              <button
                onClick={(e) => deleteSummary(s.id, e)}
                className="delete-btn"
                title="מחק סיכום"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        {summaries.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            אין סיכומים להצגה
          </div>
        )}
      </div>
      {/* Pop-up Modal */}
      {selectedSummary && (
        <div className="modal-overlay" onClick={closeSummary}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSummary.title || "ללא כותרת"}</h2>
              <button className="close-btn" onClick={closeSummary}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>{selectedSummary.content}</p>
              {selectedSummary.adminComment && (
                <div className="text-red-600 mt-2">
                  הערת אדמין: {selectedSummary.adminComment}
                </div>
              )}
            </div>
            <div className="modal-footer flex gap-3">
              <span className={`summary-status ${selectedSummary.status}`}>
                {selectedSummary.status === "approved"
                  ? "מאושר"
                  : selectedSummary.status === "pending"
                  ? "בהמתנה"
                  : "נדחה"}
              </span>
              <span className="summary-owner text-xs text-[#206db0] font-semibold">
                {selectedSummary.ownerName ? `מאת: ${selectedSummary.ownerName}` : ""}
              </span>
              {selectedSummary.createdAt && (
                <span className="summary-date">
                  {selectedSummary.createdAt.toDate
                    ? selectedSummary.createdAt.toDate().toLocaleDateString()
                    : new Date(selectedSummary.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}