'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Search, Check, UploadCloud } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useChatStore } from '@/store/chatStore';

interface FileAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FileAttachmentModal({ isOpen, onClose }: FileAttachmentModalProps) {
  const { files } = useFileStore();
  const { activeSession, attachFilesToActiveSession } = useChatStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredFiles = files.filter(file => 
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !activeSession?.file_ids.includes(file.file_id)
  );

  const toggleFile = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAttach = async () => {
    if (selectedIds.length > 0) {
      await attachFilesToActiveSession(selectedIds);
      setSelectedIds([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Attach Files</h2>
            <p className="text-xs text-gray-400 mt-1">Select from your uploaded library</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search your files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all text-white"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <button
                  key={file.file_id}
                  onClick={() => toggleFile(file.file_id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${
                    selectedIds.includes(file.file_id)
                      ? 'bg-purple-500/10 border-purple-500/40 text-white'
                      : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedIds.includes(file.file_id) ? 'bg-purple-500' : 'bg-[#1F2937]'
                  }`}>
                    {selectedIds.includes(file.file_id) ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium line-clamp-1">{file.filename}</p>
                    <p className="text-[10px] opacity-60 uppercase">{file.type || 'file'}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 opacity-40">
                <UploadCloud className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No files found to attach</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={selectedIds.length === 0}
            onClick={handleAttach}
            className="flex-[2] px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all shadow-lg shadow-purple-500/20"
          >
            Attach {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
