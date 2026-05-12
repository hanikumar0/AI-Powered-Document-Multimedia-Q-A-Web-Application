'use client';

import { useEffect } from 'react';
import { 
  FileText, 
  LayoutDashboard, 
  MessageSquare, 
  PlayCircle, 
  Settings, 
  LogOut, 
  Plus, 
  MoreVertical,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { logout } = useAuthStore();
  const { sessions, activeSession, fetchSessions, createSession, switchSession, deleteSession } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNewChat = async () => {
    await createSession("New Conversation");
    setActiveTab('chats');
  };

  const handleSwitchSession = (sessionId: string) => {
    switchSession(sessionId);
    setActiveTab('chats');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'My Files', icon: FileText },
    { id: 'media', label: 'Media Viewer', icon: PlayCircle },
  ];

  return (
    <aside className="w-72 bg-[#0B0F19] border-r border-white/5 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold gradient-text mb-6">InsightIQ</h1>
        
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Main Menu</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-[#1F2937] text-white' 
                : 'text-gray-400 hover:bg-[#1F2937]/50 hover:text-white'
            }`}
          >
            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-purple-500' : ''}`} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}

        <div className="pt-6 pb-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Recent Chats</div>
          <div className="space-y-1">
            {sessions.map((session) => (
              <div key={session.id} className="group relative">
                <button
                  onClick={() => handleSwitchSession(session.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-left ${
                    activeSession?.id === session.id 
                      ? 'bg-[#1F2937] text-white' 
                      : 'text-gray-400 hover:bg-[#1F2937]/50 hover:text-white'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeSession?.id === session.id ? 'text-purple-500' : ''}`} />
                  <span className="text-sm font-medium truncate pr-6">{session.title}</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-[#1F2937]/50 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/5 transition-colors group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
