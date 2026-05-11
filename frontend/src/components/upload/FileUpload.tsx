'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { fileService } from '@/services/fileService';
import { useFileStore } from '@/store/fileStore';

export default function FileUpload() {
  const { files, fetchFiles, addFile, updateFileStatus } = useFileStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
    // Poll for status updates every 5 seconds if files are processing
    const interval = setInterval(() => {
      if (files.some(f => f.status === 'uploaded')) {
        fetchFiles();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchFiles, files]);

  const handleUpload = async (incomingFiles: FileList | File[]) => {
    setIsUploading(true);
    for (const file of Array.from(incomingFiles)) {
      try {
        const response = await fileService.upload(file);
        addFile({
          file_id: response.file_id,
          filename: response.filename,
          type: file.type,
          status: 'uploaded'
        });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    setIsUploading(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files);
    }
  }, []);

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        accept=".pdf,.mp3,.mp4"
      />
      
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center cursor-pointer ${
          isDragging 
            ? 'border-purple-500 bg-purple-500/5' 
            : 'border-[#1F2937] hover:border-[#374151] bg-[#111827]/50'
        }`}
      >
        <div className="w-16 h-16 bg-[#1F2937] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-purple-500' : 'text-gray-400'}`} />
        </div>
        <h3 className="text-xl font-semibold mb-2">Upload your files</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
          Drag and drop your PDFs, MP3s, or MP4s here to start the AI analysis.
        </p>
        <button 
          disabled={isUploading}
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="btn-secondary px-8 flex items-center gap-2 mx-auto"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Browse Files
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">My Content</h4>
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={file.file_id}
              className="glass-card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#1F2937] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {file.status === 'uploaded' && (
                      <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> AI Processing...
                      </p>
                    )}
                    {file.status === 'processed' && (
                      <p className="text-[10px] text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready for Chat
                      </p>
                    )}
                    {file.status === 'failed' && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Analysis Failed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
