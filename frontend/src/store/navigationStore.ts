import { create } from 'zustand';

interface NavigationState {
  activeTab: string;
  seekTo: number | null;
  requestedFileId: string | null;
  currentTime: number;
  isPlaying: boolean;
  setActiveTab: (tab: string) => void;
  requestSeek: (fileId: string, time: number) => void;
  clearSeek: () => void;
  updatePlayback: (time: number, playing: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'dashboard',
  seekTo: null,
  requestedFileId: null,
  currentTime: 0,
  isPlaying: false,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  requestSeek: (fileId, time) => {
    set({ requestedFileId: fileId, seekTo: time, activeTab: 'media', isPlaying: true });
  },
  
  clearSeek: () => {
    set({ seekTo: null, requestedFileId: null });
  },

  updatePlayback: (time, playing) => set({ currentTime: time, isPlaying: playing }),
}));
