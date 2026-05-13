'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Clock, Loader2, MessageSquare, X } from 'lucide-react';
import { useNavigationStore } from '@/store/navigationStore';
import { useChatStore } from '@/store/chatStore';
import ChatWorkspace from '../chat/ChatWorkspace';

interface MediaViewerProps {
  fileUrl: string;
  type: 'video' | 'audio';
  transcript?: { start: number; end: number; text: string }[];
  status?: string;
  fileId?: string;
}

export default function MediaViewer({ fileUrl, type, transcript, status, fileId }: MediaViewerProps) {
  const { seekTo: storeSeek, requestedFileId, clearSeek, updatePlayback, currentTime: globalTime } = useNavigationStore();
  const { sessions, activeSession, switchSession, createSession, attachFilesToActiveSession } = useChatStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const sessionCreatedFor = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only seek if the file ID matches or isn't specified
    const currentFileId = fileUrl.split('/').pop();
    const isTargetFile = !requestedFileId || requestedFileId === currentFileId;

    if (storeSeek !== null && videoRef.current && isTargetFile) {
      console.log(`[MediaViewer] Seeking to ${storeSeek}s for file ${currentFileId}`);
      videoRef.current.currentTime = storeSeek;
      setCurrentTime(storeSeek);
      
      // Attempt play with promise handling
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("[MediaViewer] Autoplay prevented by browser. User must click play.", error);
        });
      }
      
      clearSeek();
    }
  }, [storeSeek, requestedFileId, fileUrl, clearSeek]);

  // Auto-scroll transcript to active segment
  useEffect(() => {
    const activeSegment = document.querySelector('.transcript-active');
    if (activeSegment) {
      activeSegment.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime]);

  const handleToggleChat = async () => {
    const nextState = !showChat;
    setShowChat(nextState);

    if (nextState && fileId) {
      // Find or create session only when opening
      const existingSession = sessions.find(s => s.file_ids.includes(fileId));
      if (existingSession) {
        if (activeSession?.id !== existingSession.id) {
          switchSession(existingSession.id);
        }
      } else {
        const session = await createSession(`Analysis: ${fileId.slice(0,8)}`);
        if (session) {
          await attachFilesToActiveSession([fileId]);
        }
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0B0F19]/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
            {type === 'video' ? <Play className="w-4 h-4 text-purple-500" /> : <Volume2 className="w-4 h-4 text-purple-500" />}
          </div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Multimedia Intelligence</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleChat}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
              showChat 
                ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                : 'bg-[#1F2937] text-gray-400 border-white/5 hover:text-white hover:border-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {showChat ? 'Close Chat' : 'AI Chat'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${showChat ? 'w-1/2' : 'w-full'}`}>
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden group">
          {type === 'video' ? (
            <video 
              key={fileUrl}
              ref={videoRef}
              src={fileUrl}
              autoPlay
              className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-pointer"
              onClick={togglePlay}
              onPlay={() => {
                setIsPlaying(true);
                updatePlayback(currentTime, true);
              }}
              onPause={() => {
                setIsPlaying(false);
                updatePlayback(currentTime, false);
              }}
              onTimeUpdate={() => {
                const time = videoRef.current?.currentTime || 0;
                setCurrentTime(time);
                updatePlayback(time, isPlaying);
              }}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onError={(e) => console.error("[MediaViewer] Video Error:", e)}
            />
          ) : (
            <div className="flex flex-col items-center gap-6 p-12">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center animate-pulse border border-purple-500/30">
                <Volume2 className="w-12 h-12 text-purple-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-white mb-2">Audio Playback</p>
                <p className="text-sm text-gray-400">Listening to media content</p>
              </div>
              <audio 
                key={fileUrl}
                ref={videoRef as any}
                src={fileUrl}
                autoPlay
                className="w-full max-w-md"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onError={(e) => console.error("[MediaViewer] Audio Error:", e)}
              />
            </div>
          )}
        </div>

        {/* Custom Controls */}
        <div className="p-6 bg-[#0B0F19] border-t border-[#30363D]">
          {/* Progress Bar */}
          <div className="relative w-full h-1.5 bg-[#1F2937] rounded-full mb-6 cursor-pointer group">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input 
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="absolute -top-1 left-0 w-full h-4 opacity-0 cursor-pointer z-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={togglePlay} 
                className="w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-500 rounded-full transition-all shadow-lg shadow-purple-500/20 active:scale-90"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-white fill-current" /> : <Play className="w-6 h-6 text-white fill-current ml-1" />}
              </button>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Time Elapsed</span>
                <div className="text-sm font-mono font-bold text-white">
                  {formatTime(currentTime)} <span className="text-gray-600 mx-2">/</span> {formatTime(duration)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !videoRef.current.muted;
                  }
                }}
                className="p-3 hover:bg-[#1F2937] rounded-xl transition-colors text-gray-400 hover:text-white border border-transparent hover:border-[#30363D]"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }
                }}
                className="p-3 hover:bg-[#1F2937] rounded-xl transition-colors text-gray-400 hover:text-white border border-transparent hover:border-[#30363D]"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Transcript Panel */}
        <div className={`w-[380px] flex flex-col border-l border-white/5 bg-[#0B0F19]/50 transition-all duration-500 ${showChat ? 'hidden xl:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Clock className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Multimedia Transcript</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={transcriptRef}>
            {transcript && transcript.length > 0 ? (
              transcript.map((segment, i) => (
                <div 
                  key={i}
                  onClick={() => seekTo(segment.start)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    currentTime >= segment.start && currentTime < segment.end
                      ? 'transcript-active bg-purple-600/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                      : 'bg-transparent border-transparent hover:bg-[#1F2937] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      currentTime >= segment.start && currentTime < segment.end
                        ? 'bg-purple-500 text-white'
                        : 'bg-[#1F2937] text-gray-500'
                    }`}>
                      {formatTime(segment.start)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{segment.text}</p>
                </div>
              ))
            ) : status === 'uploaded' ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <Loader2 className="w-12 h-12 mb-4 text-purple-500 animate-spin opacity-50" />
                <p className="text-sm font-semibold mb-2">Multimedia Intelligence is working...</p>
                <p className="text-xs text-gray-600">Gemini is currently transcribing and mapping your media content.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                <Clock className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm">No transcription data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-[450px] border-l border-white/5 bg-[#0B0F19] shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
            <ChatWorkspace compact />
          </div>
        )}
      </div>
    </div>
  );
}
