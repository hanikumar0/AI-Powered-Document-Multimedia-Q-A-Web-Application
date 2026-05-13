'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, FileText, Video, Mic, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0B0F19]">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]" />

      {/* Navbar */}
      <nav className="absolute top-0 w-full z-20 px-8 py-6 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-purple-500/20">
            I
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:inline-block">InsightIQ</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-xl text-sm font-medium border border-white/10 transition-all backdrop-blur-sm">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="z-10 text-center px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Understand <span className="gradient-text">Everything</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The AI-powered workspace for documents, meetings, and lectures. 
            Chat with your PDFs, audio, and video files in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="btn-primary flex items-center gap-2 group">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#features" className="btn-secondary">
              Learn More
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
        >
          <div className="glass-card p-8 text-left hover:border-purple-500/50 transition-colors cursor-default group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Document Intel</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Upload multi-page PDFs and get instant summaries or ask specific questions.
            </p>
          </div>

          <div className="glass-card p-8 text-left hover:border-cyan-500/50 transition-colors cursor-default group">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-6 text-cyan-500 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Multimedia Q&A</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ask about a video lecture and jump straight to the relevant timestamp.
            </p>
          </div>

          <div className="glass-card p-8 text-left hover:border-blue-500/50 transition-colors cursor-default group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Semantic Search</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Find exactly what you're looking for across all your content instantly.
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="absolute bottom-8 text-gray-500 text-sm">
        &copy; 2026 AI-Powered Multimedia Q&A. Built for the future.
      </footer>
    </div>
  );
}
