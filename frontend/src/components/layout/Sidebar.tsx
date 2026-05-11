'use client';

import { FileText, LayoutDashboard, MessageSquare, PlayCircle, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'My Files', icon: FileText },
    { id: 'chats', label: 'Conversations', icon: MessageSquare },
    { id: 'media', label: 'Media Viewer', icon: PlayCircle },
  ];

  return (
    <aside className="w-72 bg-[#111827] border-r border-[#1F2937] flex flex-col">
      <div className="p-8">
        <h1 className="text-2xl font-bold gradient-text">InsightIQ</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20' 
                : 'text-gray-400 hover:bg-[#1F2937] hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1F2937] space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-[#1F2937] transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
