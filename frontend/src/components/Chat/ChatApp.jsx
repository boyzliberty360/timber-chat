import { useState, useEffect } from "react";
import { useChatStore } from "../../store/chatStore";
import { useWebSocket } from "../../hooks/useWebSocket";
import Sidebar from "../Sidebar/Sidebar";
import ChatWindow from "./ChatWindow";
import api from "../../lib/api";

export default function ChatApp({ session }) {
  const { setRooms, activeRoom } = useChatStore();
  const { send } = useWebSocket(session, activeRoom);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/api/rooms").then((res) => setRooms(res.data || []));
  }, []);

  // Close sidebar when a room is selected on mobile
  useEffect(() => {
    if (activeRoom && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [activeRoom]);

  return (
    <div className="app-layout">
      <div className="wood-grain-overlay" />

      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile header */}
      <div className="mobile-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        {activeRoom ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>{activeRoom.is_private ? "🔒" : "🌿"}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--wood-pale)" }}>
              {activeRoom.name}
            </span>
          </div>
        ) : (
          <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--wood-pale)" }}>
            🪵 Timber
          </span>
        )}
      </div>

      <Sidebar
        session={session}
        send={send}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="chat-main">
        {activeRoom ? (
          <ChatWindow session={session} send={send} />
        ) : (
          <div className="empty-state">
            <span className="empty-icon">🌲</span>
            <h2 className="empty-title">Select a conversation</h2>
            <p className="empty-sub">Choose a room from the sidebar or start a new one</p>
          </div>
        )}
      </main>
    </div>
  );
}