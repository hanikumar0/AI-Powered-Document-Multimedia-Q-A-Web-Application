import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fileService } from '@/services/fileService';

interface FileData {
  file_id: string;
  filename: string;
  type: string;
  status: 'uploaded' | 'processed' | 'failed';
  extension?: string;
}

interface FileState {
  files: FileData[];
  selectedFile: FileData | null;
  isLoading: boolean;
  error: string | null;
  fetchFiles: () => Promise<void>;
  addFile: (file: FileData) => void;
  updateFileStatus: (fileId: string, status: FileData['status']) => void;
  setSelectedFile: (file: FileData | null) => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      selectedFile: null,
      isLoading: false,
      error: null,

      fetchFiles: async () => {
        set({ isLoading: true, error: null });
        try {
          const files = await fileService.getFiles();
          set({ files, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      addFile: (file) => {
        set((state) => ({ files: [file, ...state.files] }));
      },

      updateFileStatus: (fileId, status) => {
        set((state) => ({
          files: state.files.map((f) => (f.file_id === fileId ? { ...f, status } : f)),
        }));
      },

      setSelectedFile: (file) => {
        set({ selectedFile: file });
      },
    }),
    {
      name: 'file-storage',
    }
  )
);
