import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../firebase";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // מעבר לדשבורד
    } catch (err) {
      setError("התחברות נכשלה: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper" dir="rtl">
      <h2 className="login-title">התחברות למערכת</h2>
      <form className="login-form" onSubmit={handleLogin} autoComplete="on">
        <label htmlFor="login-email">אימייל</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />

        <label htmlFor="login-password">סיסמה</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="הקלד סיסמה"
          required
        />

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "מתחבר..." : "התחבר"}
        </button>
      </form>
      <div className="login-hint">
        אין לך משתמש? <Link to="/register">להרשמה</Link>
      </div>
    </div>
  );
}