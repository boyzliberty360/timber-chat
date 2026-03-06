import { useState, useEffect } from "react";
import { useChatStore } from "../../store/chatStore";
import { supabase } from "../../lib/supabase";
import api from "../../lib/api";
import RoomItem from "./RoomItem";
import UserSearch from "./UserSearch";

export default function Sidebar({ session, send, isOpen, onClose }) {
  const { rooms, activeRoom, setActiveRoom, addRoom } = useChatStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [browseRooms, setBrowseRooms] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSignOut = () => supabase.auth.signOut();

  useEffect(() => {
    const fetchRequests = () => {
      api.get("/api/rooms/requests").then((res) => setJoinRequests(res.data || []));
    };
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/api/rooms", { name: roomName.trim(), is_private: isPrivate, member_ids: [] });
      addRoom({ id: res.data.id, name: roomName.trim(), is_private: isPrivate });
      setRoomName("");
      setShowCreate(false);
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleBrowse = async () => {
    try {
      const res = await api.get("/api/rooms/browse");
      setBrowseRooms(res.data || []);
      setShowBrowse(true);
    } catch (err) { console.error(err); }
  };

  const handleRequestJoin = async (room) => {
    try {
      await api.post(`/api/rooms/${room.id}/request-join`);
      setBrowseRooms((prev) =>
        prev.map((r) => r.id === room.id ? { ...r, request_status: "pending" } : r)
      );
    } catch (err) { console.error(err); }
  };

  const handleRespond = async (requestId, approve) => {
    try {
      await api.post(`/api/rooms/requests/${requestId}/respond`, { approve });
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (approve) {
        api.get("/api/rooms").then((res) => {
          const { setRooms } = useChatStore.getState();
          setRooms(res.data || []);
        });
      }
    } catch (err) { console.error(err); }
  };

  const groups = rooms.filter((r) => !r.is_private);
  const privates = rooms.filter((r) => r.is_private);
  const myRoomIds = new Set(rooms.map((r) => r.id));

  return (
<aside className={`sidebar glass-panel ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        {/* Mobile close button */}
        {isOpen && (
          <button className="menu-btn" onClick={onClose} style={{ display: 'block' }}>✕</button>
        )}
        <span className="sidebar-logo">🪵</span>
        <h1 className="sidebar-title">Timber</h1>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {joinRequests.length > 0 && (
            <button className="notif-btn" onClick={() => setShowRequests(true)} title="Join requests">
              🔔
              <span className="notif-badge">{joinRequests.length}</span>
            </button>
          )}
          <button className="signout-btn" onClick={handleSignOut} title="Sign out">⎋</button>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="avatar avatar-sm">{session.user.email[0].toUpperCase()}</div>
        <span className="sidebar-email">{session.user.email}</span>
        <div className="presence-dot online" />
      </div>

      <div style={{ padding: "8px 16px 4px" }}>
        <button className="browse-btn" onClick={handleBrowse}>
          🌲 Browse Public Rooms
        </button>
      </div>
      <div style={{ padding: "4px 16px 8px" }}>
        <button className="browse-btn" onClick={() => setShowUserSearch(true)}>
          👤 Find People
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <span className="section-label">🌿 Groves</span>
          <button className="add-btn" onClick={() => { setIsPrivate(false); setShowCreate(true); }}>+</button>
        </div>
        {groups.map((room) => (
          <RoomItem key={room.id} room={room} active={activeRoom?.id === room.id} onClick={() => setActiveRoom(room)} />
        ))}
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <span className="section-label">🔒 Private</span>
          <button className="add-btn" onClick={() => { setIsPrivate(true); setShowCreate(true); }}>+</button>
        </div>
        {privates.map((room) => (
          <RoomItem key={room.id} room={room} active={activeRoom?.id === room.id} onClick={() => setActiveRoom(room)} />
        ))}
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">New {isPrivate ? "Private Chat" : "Grove"}</h3>
            <input className="glass-input" placeholder="Room name..." value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            <div className="modal-toggle">
              <label className="toggle-label">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                Private Room
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-wood" onClick={handleCreate} disabled={creating || !roomName.trim()}>
                {creating ? "..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Rooms Modal */}
      {showBrowse && (
        <div className="modal-overlay" onClick={() => setShowBrowse(false)}>
          <div className="modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🌲 Public Rooms</h3>
            <div className="browse-list">
              {browseRooms.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
                  No public rooms yet
                </p>
              )}
              {browseRooms.map((room) => (
                <div key={room.id} className="browse-item">
                  <span className="room-icon">🌿</span>
                  <span className="room-name" style={{ flex: 1, color: "var(--text-primary)" }}>{room.name}</span>
                  {room.is_member || myRoomIds.has(room.id) ? (
                    <span style={{ fontSize: "12px", color: "var(--accent)" }}>✓ Joined</span>
                  ) : room.request_status === "pending" ? (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>⏳ Pending</span>
                  ) : (
                    <button className="btn-wood" style={{ padding: "6px 14px", fontSize: "13px" }}
                      onClick={() => handleRequestJoin(room)}>
                      Request
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowBrowse(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showRequests && (
        <div className="modal-overlay" onClick={() => setShowRequests(false)}>
          <div className="modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔔 Join Requests</h3>
            <div className="browse-list">
              {joinRequests.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
                  No pending requests
                </p>
              )}
              {joinRequests.map((req) => (
                <div key={req.id} className="browse-item">
                  <div className="avatar avatar-sm">{req.username?.[0]?.toUpperCase() || "?"}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "var(--text-primary)", fontSize: "14px" }}>{req.username}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>wants to join {req.room_name}</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn-wood" style={{ padding: "5px 12px", fontSize: "12px" }}
                      onClick={() => handleRespond(req.id, true)}>✓</button>
                    <button className="btn-ghost" style={{ padding: "5px 12px", fontSize: "12px" }}
                      onClick={() => handleRespond(req.id, false)}>✗</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowRequests(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* User Search Modal */}
      {showUserSearch && <UserSearch onClose={() => setShowUserSearch(false)} />}

    </aside>
  );
}