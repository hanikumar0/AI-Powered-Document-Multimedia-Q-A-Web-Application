'use client';

import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Header({ title }: { title: string }) {
  const { user } = useAuthStore();

  return (
    <header className="h-20 border-b border-[#1F2937] flex items-center justify-between px-8 bg-[#111827]/50 backdrop-blur-md">
      <h2 className="text-xl font-semibold text-gray-200">{title}</h2>
      
      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-xl bg-[#1F2937] text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-[#1F2937]">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/10">
            {user?.name?.[0]?.toUpperCase() || 'G'}
          </div>
        </div>
      </div>
    </header>
  );
}
