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
  ChevronDown,
  MessageSquare,
  Play
} from 'lucide-react';
import { fileService } from '@/services/fileService';
import { useFileStore } from '@/store/fileStore';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/chatService';
import FileAttachmentModal from './FileAttachmentModal';
import { useNavigationStore } from '@/store/navigationStore';

interface ChatWorkspaceProps {
  compact?: boolean;
}

export default function ChatWorkspace({ compact }: ChatWorkspaceProps) {
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
    updateMessage,
    setIsLoading,
    attachFilesToActiveSession,
    fetchSessions
  } = useChatStore();
  const { currentTime, requestedFileId, activeTab, requestSeek } = useNavigationStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeSession) return;

    const userMsg: any = { 
      role: 'user', 
      content: input, 
      timestamp: new Date().toISOString() 
    };
    
    // Calculate index BEFORE adding user message
    const assistantMessageIndex = messages.length + 1;
    
    addMessage(userMsg);
    setInput('');
    setIsLoading(true);

    // Add empty placeholder for streaming assistant response
    addMessage({
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    });

    let fullContent = '';
    // Include playback context if in media mode or if a file is active
    const mediaId = activeSession?.file_ids?.[0] || requestedFileId;
    const playbackContext = (activeTab === 'media' || mediaId) ? {
      current_time: currentTime,
      media_id: mediaId
    } : {};

    try {
      const result = await chatService.sendMessageStreaming(
        input, 
        activeSession.id,
        (chunk) => {
          fullContent += chunk;
          updateMessage(assistantMessageIndex, fullContent);
        },
        playbackContext
      );
      
      // Update with final content and sources
      updateMessage(assistantMessageIndex, fullContent, result.sources);
      setIsLoading(false);
      fetchSessions();
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsLoading(false);
      
      let errorMessage = "I'm sorry, I encountered an error processing your request.";
      if (error.message?.includes('429')) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      }
      
      updateMessage(assistantMessageIndex, errorMessage);
    }
  };
  
  const parseTimeToSeconds = (timestamp: string) => {
    const clean = timestamp.replace(/[\[\]]/g, '');
    const parts = clean.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const renderContentWithTimestamps = (content: string) => {
    const timestampRegex = /\[(\d{1,2}:)?\d{1,2}:\d{2}\]/g;
    const parts = content.split(timestampRegex);
    const matches = content.match(timestampRegex);

    if (!matches) return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;

    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {matches[i] && (
              <button 
                onClick={() => {
                  if (activeSession?.file_ids?.[0]) {
                    requestSeek(activeSession.file_ids[0], parseTimeToSeconds(matches[i]));
                  }
                }}
                className="mx-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 font-mono text-[11px] hover:bg-purple-500/30 transition-all border border-purple-500/20 group/ts active:scale-95 shadow-sm"
              >
                <Play className="w-3 h-3 fill-current opacity-60 group-hover/ts:opacity-100 transition-opacity" />
                {matches[i]}
              </button>
            )}
          </span>
        ))}
      </p>
    );
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

  const attachedFiles = getAttachedFiles();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] relative overflow-hidden">
      {/* Header - Hide in compact mode */}
      {!compact && (
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
              {attachedFiles.slice(0, 3).map((f, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-[#1F2937] border-2 border-[#0B0F19] flex items-center justify-center" title={f.filename}>
                  <FileText className="w-3 h-3 text-purple-400" />
                </div>
              ))}
              {attachedFiles.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-[#1F2937] border-2 border-[#0B0F19] flex items-center justify-center text-[8px] font-bold text-gray-400">
                  +{attachedFiles.length - 3}
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsAttachmentModalOpen(true)}
              className="text-xs font-bold uppercase tracking-widest text-purple-500 hover:text-purple-400 transition-colors"
            >
              Manage Files
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto ${compact ? 'p-4' : 'p-8'} space-y-8 custom-scrollbar`}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 bg-purple-600/10 rounded-3xl flex items-center justify-center border border-purple-500/10"
            >
              <Bot className="w-10 h-10 text-purple-500" />
            </motion.div>
            <div className="max-w-sm space-y-3">
              <h3 className="text-xl font-bold text-white">Document Intelligence</h3>
              <p className="text-sm text-gray-400">
                Upload or attach files to chat with your data, or ask me anything for general assistance.
              </p>
            </div>
            {attachedFiles.length === 0 && (
              <button 
                onClick={() => setIsAttachmentModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600/10 border border-purple-500/20 rounded-2xl text-purple-500 hover:bg-purple-600/20 transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Paperclip className="w-4 h-4" />
                Attach Documents
              </button>
            )}
          </div>
        )}
        
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-6 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                msg.role === 'user' ? 'bg-purple-600 shadow-purple-500/20' : 'bg-[#1E293B] border border-white/5'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-cyan-400" />}
              </div>
              
              <div className={`space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-5 rounded-[28px] ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/10' 
                    : 'bg-[#1E293B] border border-white/5 text-gray-200'
                }`}>
                  {renderContentWithTimestamps(msg.content)}
                  {msg.role === 'assistant' && i === messages.length - 1 && isLoading && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle" />
                  )}
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source: any, j: number) => (
                      <button key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider hover:bg-cyan-500/10 transition-all">
                        {source.filename} {source.timestamp && `@ ${source.timestamp}`}
                      </button>
                    ))}
                  </div>
                )}
                <p className={`text-[10px] text-gray-500 font-bold uppercase tracking-widest px-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="flex gap-6">
              <div className="w-10 h-10 rounded-2xl bg-[#1E293B] border border-white/5 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              </div>
              <div className="bg-[#1E293B] border border-white/5 px-6 py-4 rounded-[28px]">
                <div className="flex gap-1.5">
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
      <div className={`${compact ? 'p-4' : 'p-8'} pt-0`}>
        <div className="max-w-4xl mx-auto">
          {/* File Chips */}
          <AnimatePresence>
            {attachedFiles.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-wrap gap-2 mb-4"
              >
                {attachedFiles.map(file => (
                  <div key={file.file_id} className="flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] border border-white/10 rounded-xl group transition-all hover:border-purple-500/50">
                    <FileText className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] font-bold text-gray-300 truncate max-w-[150px] uppercase tracking-wider">{file.filename}</span>
                    <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all text-gray-500 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <div className="absolute inset-0 bg-purple-600/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="relative flex items-end gap-2 bg-[#1E293B]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 pr-4 focus-within:border-purple-500/50 transition-all shadow-2xl">
              <button 
                onClick={() => setIsAttachmentModalOpen(true)}
                className="p-4 text-gray-400 hover:text-purple-400 transition-colors"
                title="Attach Files"
              >
                <Paperclip className="w-6 h-6" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Gemini..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white py-4 px-2 resize-none max-h-40 custom-scrollbar text-sm placeholder:text-gray-500"
              />

              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3.5 rounded-[22px] transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40 hover:bg-purple-500 active:scale-95' 
                    : 'bg-white/5 text-gray-600'
                }`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-5 font-bold uppercase tracking-[0.2em]">
            Gemini 3 Flash • Secure Intelligence
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

