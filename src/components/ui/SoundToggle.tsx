import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '@/audio';

interface SoundToggleProps {
  className?: string;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ className = '' }) => {
  const [isMuted, setIsMuted] = useState<boolean>(audioManager.isMuted());

  useEffect(() => {
    const unsubscribe = audioManager.subscribe((muted) => {
      setIsMuted(muted);
    });
    return unsubscribe;
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioManager.toggleMuted();
  };

  return (
    <button
      onClick={handleToggle}
      className={`group inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 rounded-full text-slate-400 hover:text-white 
        transition-all duration-300 backdrop-blur-md bg-[#0b1b3d]/25 border border-[#6b7bff]/20 hover:border-[#a78bfa]/50 
        hover:shadow-[0_0_12px_rgba(167,139,250,0.2)] active:scale-[0.93] touch-manipulation focus-visible:outline-none focus-visible:ring-1 
        focus-visible:ring-[#a78bfa]/60 ${className}`}
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      title={isMuted ? 'Unmute sound' : 'Mute sound'}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 text-slate-400 group-hover:text-[#a78bfa] transition-colors duration-300" strokeWidth={1.5} />
      ) : (
        <Volume2 className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
      )}
    </button>
  );
};
