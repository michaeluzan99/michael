import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [displayName, setDisplayName] = useState("");
  const [counts, setCounts] = useState({ tasks: 0, summaries: 0, messages: 0, pendingSummaries: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then(snap => {
      const data = snap.data() || {};
      setDisplayName(data.displayName || user.displayName || user.email || "User");
      setIsAdmin(data.role === "admin");
    });

    // מאזינים לכל שינוי באוספים
    const unsubTasks = onSnapshot(collection(db, "tasks"), snap => {
      setCounts(prev => ({ ...prev, tasks: snap.size }));
    });
    const unsubSummaries = onSnapshot(collection(db, "summaries"), snap => {
      setCounts(prev => ({ ...prev, summaries: snap.size }));
    });
    const unsubMessages = onSnapshot(collection(db, "messages"), snap => {
      setCounts(prev => ({ ...prev, messages: snap.size }));
    });

    // Pending summaries – רק אם אדמין
    let unsubPending = () => {};
    if (user) {
      const q = query(collection(db, "summaries"), where("status", "==", "pending"));
      unsubPending = onSnapshot(q, snap => {
        setCounts(prev => ({ ...prev, pendingSummaries: snap.size }));
      });
    }

    // מנקה מאזינים
    return () => {
      unsubTasks();
      unsubSummaries();
      unsubMessages();
      unsubPending();
    };
  }, []);

  // קוביית סטטיסטיקה
  function StatCard({ icon, label, count, cardClass, route }) {
    return (
      <div className={`stat-card ${cardClass}`} onClick={() => navigate(route)}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
          <span className="stat-label">{label}</span>
          <span className="stat-count">{count}</span>
        </div>
      </div>
    );
  }

  return (
    <section className="dashboard-wrapper">
      <div className="welcome-row">
        <span className="avatar">
          <svg width="48" height="48" fill="#7093e0"><circle cx="24" cy="24" r="24" fill="#e5edfb"/><text x="50%" y="65%" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#7093e0">{displayName?.[0]?.toUpperCase() || "U"}</text></svg>
        </span>
        <h2>
          Welcome, <span className="welcome-name">{displayName}</span> <span className="wave">👋</span>
        </h2>
      </div>
      <div className="dashboard-grid">
        <StatCard
          icon={<span style={{fontSize:32}}>📝</span>}
          label="Tasks"
          count={counts.tasks}
          cardClass="stat-card-tasks"
          route="/tasks"
        />
        <StatCard
          icon={<span style={{fontSize:32}}>📚</span>}
          label="Summaries"
          count={counts.summaries}
          cardClass="stat-card-summaries"
          route="/summaries"
        />
        <StatCard
          icon={<span style={{fontSize:32}}>💬</span>}
          label="Messages"
          count={counts.messages}
          cardClass="stat-card-messages"
          route="/messages"
        />
        {isAdmin && (
          <StatCard
            icon={<span style={{fontSize:32}}>🛡️</span>}
            label="Pending Summaries"
            count={counts.pendingSummaries}
            cardClass="stat-card-pending"
            route="/admin"
          />
        )}
      </div>
    </section>
  );
}