import { create } from 'zustand';
import { chatService } from '@/services/chatService';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  file_ids: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: any[];
}

interface ChatState {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  messages: Message[];
  isLoading: boolean;
  
  fetchSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setActiveSession: (session: ChatSession | null) => void;
  attachFilesToActiveSession: (fileIds: string[]) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSession: null,
  messages: [],
  isLoading: false,

  fetchSessions: async () => {
    try {
      const sessions = await chatService.getSessions();
      set({ sessions });
    } catch (error) {
      console.error('Fetch sessions error:', error);
    }
  },

  createSession: async (title) => {
    set({ isLoading: true });
    try {
      const session = await chatService.createSession(title);
      set((state) => ({ 
        sessions: [session, ...state.sessions],
        activeSession: session,
        messages: [],
        isLoading: false
      }));
      return session;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  switchSession: async (sessionId) => {
    set({ isLoading: true });
    try {
      const messages = await chatService.getMessages(sessionId);
      const session = get().sessions.find(s => s.id === sessionId) || null;
      set({ 
        activeSession: session,
        messages,
        isLoading: false
      });
    } catch (error) {
      console.error('Switch session error:', error);
      set({ isLoading: false });
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await chatService.deleteSession(sessionId);
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
        messages: state.activeSession?.id === sessionId ? [] : state.messages
      }));
    } catch (error) {
      console.error('Delete session error:', error);
    }
  },

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  setMessages: (messages) => set({ messages }),

  setActiveSession: (session) => set({ activeSession: session }),

  attachFilesToActiveSession: async (fileIds) => {
    const { activeSession } = get();
    if (!activeSession) return;

    try {
      await chatService.attachFiles(activeSession.id, fileIds);
      set((state) => ({
        activeSession: state.activeSession ? {
          ...state.activeSession,
          file_ids: Array.from(new Set([...state.activeSession.file_ids, ...fileIds]))
        } : null
      }));
    } catch (error) {
      console.error('Attach files error:', error);
    }
  }
}));
