import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/Navbar.css"; // שים את ה-CSS למטה

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  const navigate = useNavigate();
  const handleNav = (to) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        <span className="navbar-logo" onClick={() => handleNav("/")}>
          📚 StudyHub
        </span>
        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" end className="navbar-link">
            Dashboard
          </NavLink>
          {user && <NavLink to="/summaries" className="navbar-link">Summaries</NavLink>}
          {user && <NavLink to="/tasks" className="navbar-link">Tasks</NavLink>}
          {user && <NavLink to="/messages" className="navbar-link">Messages</NavLink>}
          {user && <NavLink to="/settings" className="navbar-link">Settings</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" className="navbar-link">Admin</NavLink>}
        </div>
        <div className="navbar-user-area">
          {user && (
            <span className="navbar-username">Hi, {displayName}</span>
          )}
          {user ? (
            <button className="navbar-btn-logout" onClick={logout}>
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className="navbar-link">Login</NavLink>
              <NavLink to="/register" className="navbar-link">Sign Up</NavLink>
            </>
          )}
        </div>
        <button className="navbar-menu-btn" onClick={() => setMenuOpen(m => !m)}>
          <span className="navbar-menu-icon">{menuOpen ? "✖️" : "☰"}</span>
        </button>
      </div>
      {menuOpen && (
        <div className="navbar-mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
}