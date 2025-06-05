import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import "../styles/Settings.css";

const ADMIN_CODE = "ono1234"; // תחליף לקוד שלך

export default function Settings() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // טען נתוני המשתמש מ-Firestore
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      // שליפה מהמאגר (אם לא קיים משתמש – fallback ל-auth)
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(data.displayName || user.displayName || "");
          setEmail(data.email || user.email || "");
        } else {
          setDisplayName(user.displayName || "");
          setEmail(user.email || "");
        }
      } catch {
        setDisplayName(user.displayName || "");
        setEmail(user.email || "");
      }
    };
    loadProfile();
  }, []);

  // עדכון שם פרופיל במאגר + ב־Auth
  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("לא מחובר");
      // עדכון ב־Auth
      await updateProfile(user, { displayName });
      // עדכון ב־Firestore
      await updateDoc(doc(db, "users", user.uid), { displayName });
      setMessage("הפרופיל עודכן בהצלחה!");
    } catch (e) {
      setMessage("עדכון נכשל.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 2800);
    }
  };

  // טיפול בקוד אדמין
  const handleAdminCode = async (e) => {
    e.preventDefault();
    setAdminStatus("");
    const user = auth.currentUser;
    if (!user) return;
    if (adminCode.trim() === ADMIN_CODE) {
      await updateDoc(doc(db, "users", user.uid), { role: "admin" });
      setAdminStatus("קיבלת הרשאות אדמין ✅");
    } else {
      setAdminStatus("קוד לא נכון 🚫");
    }
    setAdminCode("");
    setTimeout(() => setAdminStatus(""), 2500);
  };

  return (
    <section className="settings-wrapper">
      <h1 className="page-title">הגדרות</h1>
      <div className="settings-card">
        <label htmlFor="displayName">שם מלא</label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="שם מלא"
        />

        <label htmlFor="email">אימייל</label>
        <input
          type="email"
          id="email"
          value={email}
          disabled
          readOnly
          className="input-disabled"
        />

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={loading || displayName.trim() === ""}
        >
          {loading ? "שומר..." : "שמור שינויים"}
        </button>

        {message && <p className="message">{message}</p>}

        <hr className="my-5" />
        <form className="admin-box" onSubmit={handleAdminCode}>
          <label style={{ color: "#2563eb", fontWeight: 600, marginBottom: 3, fontSize: "1.06rem" }}>
            הכנס קוד אדמין (רק אם ברצונך להיות אדמין במערכת)
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
            <input
              type="text"
              className="input-admin"
              placeholder="קוד אדמין"
              value={adminCode}
              onChange={e => setAdminCode(e.target.value)}
            />
            <button className="btn-secondary" type="submit">שלח</button>
          </div>
          {adminStatus && (
            <div className="admin-status">{adminStatus}</div>
          )}
        </form>
      </div>
    </section>
  );
}