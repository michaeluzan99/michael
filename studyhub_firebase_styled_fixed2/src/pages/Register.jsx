import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, createUserWithEmailAndPassword } from "../firebase";
import { setDoc, doc, db } from "../firebase";
import "../styles/register.css";
import { updateProfile } from "firebase/auth"; // הוספה חשובה
const ADMIN_CODE = "ono1234"; // תחליף למה שתרצה

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!displayName.trim()) throw new Error("יש להזין שם מלא");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // קביעת ROLE
      const role = adminCode === ADMIN_CODE ? "admin" : "user";

      // עדכון שם התצוגה ב־Firebase Auth (בצורה הנכונה)
      await updateProfile(user, { displayName });

      // יצירת מסמך משתמש בפיירסטור
      await setDoc(doc(db, "users", user.uid), {
        displayName,
        email,
        role,
      });

      navigate("/"); // מעבר לדשבורד
    } catch (err) {
      setError(err.message || "שגיאת הרשמה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-wrapper" dir="rtl">
      <h2 className="register-title">הרשמה למערכת</h2>
      <form className="register-form" onSubmit={handleRegister}>
        <label htmlFor="register-displayName">שם מלא</label>
        <input
          id="register-displayName"
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="שם מלא"
          required
        />

        <label htmlFor="register-email">אימייל</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />

        <label htmlFor="register-password">סיסמה</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="הקלד סיסמה"
          required
        />

        <label htmlFor="admin-code">קוד אדמין (לא חובה)</label>
        <input
          id="admin-code"
          type="text"
          value={adminCode}
          onChange={e => setAdminCode(e.target.value)}
          placeholder="קוד לאדמין (לא חובה)"
        />

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "נרשם..." : "הרשמה"}
        </button>
      </form>
      <div className="register-hint">
        כבר יש לך משתמש? <Link to="/login">להתחברות</Link>
      </div>
    </div>
  );
}