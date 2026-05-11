'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Clock } from 'lucide-react';

interface MediaViewerProps {
  fileUrl: string;
  type: 'video' | 'audio';
  transcript?: { start: number; end: number; text: string }[];
}

export default function MediaViewer({ fileUrl, type, transcript }: MediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <div className="glass-card overflow-hidden flex flex-col h-full">
      <div className="relative aspect-video bg-black flex items-center justify-center">
        {type === 'video' ? (
          <video 
            ref={videoRef}
            src={fileUrl}
            className="w-full h-full"
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
              <Volume2 className="w-10 h-10 text-purple-500" />
            </div>
            <p className="text-gray-400">Audio Playback</p>
            <audio 
              ref={videoRef as any}
              src={fileUrl}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            />
          </div>
        )}
      </div>

      {/* Custom Controls */}
      <div className="p-4 bg-[#111827] border-t border-[#1F2937]">
        {/* Progress Bar */}
        <div className="relative w-full h-1 bg-[#1F2937] rounded-full mb-4 cursor-pointer group">
          <div 
            className="absolute top-0 left-0 h-full bg-[#7C3AED] rounded-full" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <input 
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <div className="text-sm font-mono text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors">
              <Volume2 className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transcript View */}
      {transcript && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 border-t border-[#1F2937]">
          <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" /> Transcript
          </h4>
          {transcript.map((segment, i) => (
            <div 
              key={i}
              onClick={() => seekTo(segment.start)}
              className={`p-3 rounded-xl cursor-pointer transition-all ${
                currentTime >= segment.start && currentTime < segment.end
                  ? 'bg-purple-500/10 border border-purple-500/30 text-white'
                  : 'hover:bg-[#1F2937] text-gray-400'
              }`}
            >
              <span className="text-xs font-mono text-purple-500 mr-2">[{formatTime(segment.start)}]</span>
              <span className="text-sm">{segment.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
