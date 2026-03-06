import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  readReceipts: {},

  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (room) => set({ activeRoom: room }),
  addRoom: (room) => set((s) => ({ rooms: [...s.rooms, room] })),

  setMessages: (roomId, messages) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: messages } })),

  addMessage: (roomId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] || []), message],
      },
    })),

  setTyping: (roomId, userId, username, isTyping) =>
    set((s) => {
      const roomTyping = { ...(s.typingUsers[roomId] || {}) };
      if (isTyping) roomTyping[userId] = username;
      else delete roomTyping[userId];
      return { typingUsers: { ...s.typingUsers, [roomId]: roomTyping } };
    }),

  setUserOnline: (userId) =>
    set((s) => { const next = new Set(s.onlineUsers); next.add(userId); return { onlineUsers: next }; }),

  setUserOffline: (userId) =>
    set((s) => { const next = new Set(s.onlineUsers); next.delete(userId); return { onlineUsers: next }; }),

  addReadReceipt: (messageId, userId) =>
    set((s) => ({
      readReceipts: {
        ...s.readReceipts,
        [messageId]: [...(s.readReceipts[messageId] || []), userId],
      },
    })),
}));