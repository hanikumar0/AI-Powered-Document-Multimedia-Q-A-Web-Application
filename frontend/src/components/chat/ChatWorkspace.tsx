'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  User, 
  Bot, 
  Paperclip, 
  Clock, 
  FileText, 
  Plus, 
  Upload, 
  FilePlus, 
  X,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { fileService } from '@/services/fileService';
import { useFileStore } from '@/store/fileStore';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/chatService';
import FileAttachmentModal from './FileAttachmentModal';

export default function ChatWorkspace() {
  const [input, setInput] = useState('');
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { files } = useFileStore();
  const { 
    activeSession, 
    messages, 
    isLoading, 
    addMessage, 
    attachFilesToActiveSession,
    fetchSessions
  } = useChatStore();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeSession) return;

    const userMsg: any = { 
      role: 'user', 
      content: input, 
      timestamp: new Date().toISOString() 
    };
    
    addMessage(userMsg);
    setInput('');

    try {
      const response = await chatService.sendMessage(input, activeSession.id);
      addMessage(response);
      fetchSessions(); // Refresh to update session order/titles
    } catch (error: any) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;

    setIsUploading(true);
    try {
      const uploadedData = await fileService.upload(file);
      await attachFilesToActiveSession([uploadedData.file_id]);
      
      addMessage({
        role: 'assistant',
        content: `Uploaded and attached: **${file.name}**. I'm analyzing it now!`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getAttachedFiles = () => {
    if (!activeSession) return [];
    return files.filter(f => activeSession.file_ids.includes(f.file_id));
  };

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F19] text-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-6"
        >
          <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center mx-auto border border-purple-500/20">
            <MessageSquare className="w-10 h-10 text-purple-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Select a conversation</h2>
            <p className="text-gray-400">Choose a chat from the sidebar or start a new one to begin exploring your documents.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] relative overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0B0F19]/50 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <h2 className="text-sm font-semibold text-white truncate max-w-[300px]">
            {activeSession.title}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {getAttachedFiles().slice(0, 3).map((f, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-[#1F2937] border-2 border-[#0B0F19] flex items-center justify-center">
                <FileText className="w-3 h-3 text-purple-400" />
              </div>
            ))}
            {getAttachedFiles().length > 3 && (
              <div className="w-6 h-6 rounded-full bg-[#1F2937] border-2 border-[#0B0F19] flex items-center justify-center text-[8px] font-bold text-gray-400">
                +{getAttachedFiles().length - 3}
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsAttachmentModalOpen(true)}
            className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Manage Files
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40 py-20">
            <Bot className="w-16 h-16 text-purple-500" />
            <div className="max-w-sm">
              <h3 className="text-lg font-semibold text-white">How can I help you today?</h3>
              <p className="text-sm mt-2">Upload or attach files to enable document-aware intelligence, or ask a general question.</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-6 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                msg.role === 'user' ? 'bg-[#7C3AED] shadow-purple-500/20' : 'bg-[#1F2937] border border-white/5'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-cyan-400" />}
              </div>
              
              <div className="space-y-3">
                <div className={`p-5 rounded-3xl ${
                  msg.role === 'user' 
                    ? 'bg-[#7C3AED] text-white shadow-xl shadow-purple-500/10' 
                    : 'bg-[#1F2937] border border-white/5 text-gray-200'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source: any, j: number) => (
                      <button key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/10 transition-all">
                        <Clock className="w-3 h-3" />
                        {source.filename} {source.timestamp && `@ ${source.timestamp}`}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 font-medium px-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-6">
              <div className="w-10 h-10 rounded-2xl bg-[#1F2937] border border-white/5 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              </div>
              <div className="bg-[#1F2937] border border-white/5 p-5 rounded-3xl">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 pt-0">
        <div className="max-w-4xl mx-auto">
          {/* File Chips */}
          <AnimatePresence>
            {getAttachedFiles().length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-wrap gap-2 mb-4"
              >
                {getAttachedFiles().map(file => (
                  <div key={file.file_id} className="flex items-center gap-2 px-3 py-1.5 bg-[#1F2937] border border-white/10 rounded-xl group transition-all hover:border-purple-500/50">
                    <FileText className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] font-medium text-gray-300 truncate max-w-[150px]">{file.filename}</span>
                    <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all text-gray-500 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setIsAttachmentModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-600/20 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Add More</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <div className="absolute inset-0 bg-purple-600/10 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div className="relative flex items-end gap-2 bg-[#1F2937]/80 backdrop-blur-xl border border-white/10 rounded-[28px] p-2 pr-4 focus-within:border-purple-500/50 transition-all shadow-2xl">
              <div className="flex flex-col">
                <button 
                  onClick={() => setIsAttachmentModalOpen(true)}
                  className="p-3 text-gray-400 hover:text-purple-400 transition-colors"
                  title="Attach Existing File"
                >
                  <FilePlus className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-400 hover:text-purple-400 transition-colors"
                  title="Upload New File"
                >
                  <Upload className="w-6 h-6" />
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white py-3 px-2 resize-none max-h-40 custom-scrollbar text-sm placeholder:text-gray-500"
              />

              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-2xl transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40 hover:bg-purple-500 active:scale-95' 
                    : 'bg-white/5 text-gray-600'
                }`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-4 font-medium uppercase tracking-widest">
            Gemini 2.0 Flash • Document Intelligence Workspace
          </p>
        </div>
      </div>

      <FileAttachmentModal 
        isOpen={isAttachmentModalOpen} 
        onClose={() => setIsAttachmentModalOpen(false)} 
      />
    </div>
  );
}

import { MessageSquare } from 'lucide-react';
