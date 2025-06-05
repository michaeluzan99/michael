import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import "../styles/messages.css";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => scrollToBottom(), 50);
    });
    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // שליפת displayName עדכנית מה־DB
    let displayName = user.displayName || user.email;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const u = userDoc.data();
        displayName = u.displayName || u.email || user.email;
      }
    } catch {}
    await addDoc(collection(db, "messages"), {
      text: newMessage.trim(),
      senderId: user.uid,
      senderName: displayName,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
  };

  if (!user) return <p className="text-center mt-8">אנא התחבר כדי להשתמש בצ'אט</p>;

  return (
    <section className="page-wrapper max-w-3xl mx-auto p-4 flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4 text-center">צ'אט בזמן אמת</h1>
      <div
        className="messages-list flex-grow overflow-auto mb-4 border rounded p-3 bg-white flex flex-col gap-2"
        style={{ maxHeight: "60vh" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-[75%] ${
              msg.senderId === user.uid ? "bg-blue-500 text-white self-end" : "bg-gray-100 self-start"
            }`}
          >
            <p className="text-xs font-bold mb-1">
              {msg.senderName || msg.senderId}
            </p>
            <p className="break-words">{msg.text}</p>
            <small className="text-[11px] text-gray-600 mt-1 block text-right">
              {msg.createdAt?.toDate
                ? msg.createdAt.toDate().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
                : "..."}
            </small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          className="input-field flex-grow border rounded px-3 py-2 focus:ring focus:ring-blue-300"
          placeholder="כתוב הודעה..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          required
          autoFocus
        />
        <button
          type="submit"
          className="btn-primary bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          disabled={!newMessage.trim()}
        >
          שלח
        </button>
      </form>
    </section>
  );
}