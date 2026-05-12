'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, MessageSquare, FileText, PlayCircle, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import FileUpload from '@/components/upload/FileUpload';
import { useFileStore } from '@/store/fileStore';
import { useChatStore } from '@/store/chatStore';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { files, fetchFiles, isLoading, setSelectedFile } = useFileStore();
  const { createSession, attachFilesToActiveSession } = useChatStore();

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const processedFilesCount = files.filter(f => f.status === 'processed').length;
  const processingFilesCount = files.filter(f => f.status === 'uploaded').length;

  return (
    <div className="flex h-screen bg-[#0B0F19] text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
        
        <main className="flex-1 overflow-y-auto p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-gray-400">Manage your documents and multimedia insights.</p>
              </div>
              <button 
                onClick={() => setActiveTab('files')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> New Upload
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  {[
                    { label: 'Total Files', value: files.length.toString(), icon: FileText, color: 'text-purple-500' },
                    { label: 'Processed', value: processedFilesCount.toString(), icon: CheckCircle2, color: 'text-green-500' },
                    { label: 'Processing', value: processingFilesCount.toString(), icon: Loader2, color: 'text-cyan-500' },
                    { label: 'Chat Ready', value: (processedFilesCount > 0 ? 'Yes' : 'No'), icon: MessageSquare, color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-[#1F2937] ${stat.color}`}>
                        <stat.icon className={`w-6 h-6 ${stat.label === 'Processing' && processingFilesCount > 0 ? 'animate-spin' : ''}`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-card p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Recent Activity</h3>
                    <button onClick={() => setActiveTab('files')} className="text-sm text-purple-500 hover:underline">View All</button>
                  </div>
                  
                  {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-[#1F2937] rounded-2xl">
                      <Upload className="w-12 h-12 mb-4 opacity-20" />
                      <p>No files uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {files.slice(0, 5).map((file) => (
                        <div key={file.file_id} className="flex items-center justify-between p-4 bg-[#111827]/50 rounded-xl border border-[#1F2937]">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-[#1F2937]">
                              <FileText className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{file.filename}</p>
                              <p className="text-xs text-gray-500 uppercase tracking-widest">{file.status}</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              const session = await createSession(file.filename);
                              await attachFilesToActiveSession([file.file_id]);
                              setActiveTab('chats');
                            }}
                            className="text-xs px-4 py-2 rounded-lg bg-[#1F2937] hover:bg-[#1F2937]/80 text-gray-400 hover:text-white transition-colors"
                          >
                            Open Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="max-w-4xl mx-auto">
                <FileUpload />
              </div>
            )}

            {activeTab === 'chats' && (
              <div className="h-[700px] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl">
                <ChatWorkspace />
              </div>
            )}

            {activeTab === 'media' && (
              <div className="h-[700px] flex flex-col items-center justify-center text-gray-500">
                <PlayCircle className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a multimedia file from the chat or files list to view.</p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
