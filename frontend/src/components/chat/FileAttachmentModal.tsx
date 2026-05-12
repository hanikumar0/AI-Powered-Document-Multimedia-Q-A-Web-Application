'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Search, Check, UploadCloud, Loader2, Plus, ArrowLeft } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useChatStore } from '@/store/chatStore';
import { fileService } from '@/services/fileService';

interface FileAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FileAttachmentModal({ isOpen, onClose }: FileAttachmentModalProps) {
  const { files, addFile } = useFileStore();
  const { activeSession, attachFilesToActiveSession } = useChatStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'select' | 'upload'>('select');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await fileService.upload(file);
      addFile({
        file_id: response.file_id,
        filename: response.filename,
        type: file.type,
        status: 'uploaded'
      });
      // Automatically select and attach the newly uploaded file
      await attachFilesToActiveSession([response.file_id]);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setView('select');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            {view === 'upload' && (
              <button 
                onClick={() => setView('select')}
                className="p-2 hover:bg-white/5 rounded-full text-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {view === 'select' ? 'Attach Files' : 'Upload New File'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {view === 'select' ? 'Select from your library' : 'Add to your document intelligence'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {view === 'select' ? (
              <motion.div 
                key="select"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all text-white"
                    />
                  </div>
                  <button 
                    onClick={() => setView('upload')}
                    className="p-3 bg-purple-600/20 border border-purple-500/20 rounded-2xl text-purple-500 hover:bg-purple-600/30 transition-all"
                    title="Upload New"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-[350px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => (
                      <button
                        key={file.file_id}
                        onClick={() => toggleFile(file.file_id)}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                          selectedIds.includes(file.file_id)
                            ? 'bg-purple-500/10 border-purple-500/40 text-white'
                            : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedIds.includes(file.file_id) ? 'bg-purple-600 shadow-lg shadow-purple-500/30' : 'bg-[#1E293B]'
                        }`}>
                          {selectedIds.includes(file.file_id) ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold line-clamp-1">{file.filename}</p>
                          <p className="text-[10px] opacity-60 uppercase font-bold tracking-wider">{file.status || 'READY'}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-16 opacity-30">
                      <UploadCloud className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-sm font-medium">No files available to attach</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="py-10"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,.mp3,.mp4"
                />
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-[32px] p-12 text-center cursor-pointer hover:bg-white/5 transition-all group"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    {isUploading ? (
                      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                    ) : (
                      <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {isUploading ? 'Uploading...' : 'Click to Upload'}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
                    Supports PDF, MP3, and MP4 files up to 25MB.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {view === 'select' && (
          <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={selectedIds.length === 0}
              onClick={handleAttach}
              className="flex-[2] px-4 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-purple-500/20"
            >
              Attach {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
