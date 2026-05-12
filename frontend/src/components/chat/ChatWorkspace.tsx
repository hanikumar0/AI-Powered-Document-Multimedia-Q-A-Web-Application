'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot, Paperclip, Clock, FileText } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { fileService } from '@/services/fileService';
import { useFileStore } from '@/store/fileStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { filename: string; timestamp?: string }[];
}

export default function ChatWorkspace() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your AI assistant. Ask me anything about your uploaded files.", 
      timestamp: new Date().toLocaleTimeString() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedFile, setSelectedFile, addFile } = useFileStore();
  const [isAttaching, setIsAttaching] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      const welcomeMsg: Message = {
        role: 'assistant',
        content: `I've loaded your file: **${selectedFile.filename}**. 

How can I help you with this ${selectedFile.type || 'document'}? I can summarize it, answer specific questions, or help you find details.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([welcomeMsg]);
      // Optional: Clear selection after loading so it doesn't re-trigger on remount 
      // unless that's desired behavior. Let's keep it for now.
    }
  }, [selectedFile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAttaching(true);
    try {
      const uploadedData = await fileService.upload(file);
      addFile(uploadedData);
      setSelectedFile(uploadedData);
      
      const systemMsg: Message = {
        role: 'assistant',
        content: `Attached and processed: **${file.name}**. I'm ready to answer questions about it!`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, systemMsg]);
    } catch (error) {
      console.error('Attachment error:', error);
      const errorMsg: Message = {
        role: 'assistant',
        content: `Sorry, I couldn't attach **${file.name}**. Please try again.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAttaching(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { 
      role: 'user', 
      content: input, 
      timestamp: new Date().toLocaleTimeString() 
    };
    
    setMessages((prev: Message[]) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(input, selectedFile?.file_id);
      const aiMsg: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString(),
        sources: response.sources
      };
      setMessages((prev: Message[]) => [...prev, aiMsg]);
    } catch (error: any) {
      const errMsg: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev: Message[]) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg: Message, i: number) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-purple-600' : 'bg-[#1F2937]'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-cyan-400" />}
              </div>
              
              <div className="space-y-2">
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' ? 'bg-[#7C3AED] text-white' : 'glass-card border border-white/5 text-gray-200'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source: any, j: number) => (
                      <button key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] hover:bg-cyan-500/20 transition-colors">
                        <Clock className="w-3 h-3" />
                        {source.filename} {source.timestamp && `@ ${source.timestamp}`}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 px-1">{msg.timestamp}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1F2937] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div className="glass-card p-4 rounded-2xl flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 bg-[#111827]/50 border-t border-[#1F2937]">
        {selectedFile && (
          <div className="max-w-4xl mx-auto mb-4 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-medium truncate max-w-[200px]">{selectedFile.filename}</span>
              <button 
                onClick={() => setSelectedFile(null)}
                className="ml-1 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.mp4"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about your files..."
            disabled={isLoading || isAttaching}
            className="w-full bg-[#1F2937] border border-[#374151] rounded-2xl pl-12 pr-16 py-4 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-500 text-white disabled:opacity-50"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAttaching}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-1.5 transition-colors ${
              isAttaching ? 'text-purple-500 animate-spin' : 'text-gray-500 hover:text-purple-500'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
