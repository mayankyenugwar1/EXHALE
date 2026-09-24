import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CosmicBackground } from '@/components/features/cosmos/CosmicBackground';
import { HomeScreen } from '@/components/features/home/HomeScreen';
import { ThoughtInputScreen } from '@/components/features/thought/ThoughtInputScreen';
import { CosmicJourney } from '@/components/features/journey/CosmicJourney';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { JourneyStage } from '@/types';
import { audioManager } from '@/audio';

const INITIAL_TIMER_SECONDS = 30; // 0:30

/**
 * EXHALE Root Application Shell:
 * 
 * Orchestrates the continuous 5-stage master journey:
 * 1. HOME: Mindful cosmic portal ("Give your mind some space.")
 * 2. THOUGHT INPUT: Intimate thought unloading ("What's on your mind?")
 * 3. BREATHE: Meditative cosmic breathing (~30s focused reset)
 * 4. DRIFTING: Perspective shift where thought shrinks into the cosmic expanse
 * 5. COMPLETION: Space and peaceful resolution ("A little more space.")
 */
export const App: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Hydrate session state from URL query or sessionStorage (prevents accidental refresh wipes)
  const [stage, setStage] = useState<JourneyStage>(() => {
    try {
      const urlStage = new URLSearchParams(window.location.search).get('stage');
      if (urlStage) return urlStage as JourneyStage;
      const savedStage = sessionStorage.getItem('exhale_stage');
      return (savedStage as JourneyStage) || 'home';
    } catch {
      return 'home';
    }
  });

  const [thought, setThought] = useState<string>(() => {
    try {
      const urlThought = new URLSearchParams(window.location.search).get('thought');
      if (urlThought) return urlThought;
      return sessionStorage.getItem('exhale_thought') || '';
    } catch {
      return '';
    }
  });

  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    try {
      const savedTime = sessionStorage.getItem('exhale_timer');
      const parsed = savedTime ? parseInt(savedTime, 10) : INITIAL_TIMER_SECONDS;
      return parsed > INITIAL_TIMER_SECONDS ? INITIAL_TIMER_SECONDS : parsed;
    } catch {
      return INITIAL_TIMER_SECONDS;
    }
  });

  const [cosmicExpansion, setCosmicExpansion] = useState<number>(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state changes with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('exhale_stage', stage);
      sessionStorage.setItem('exhale_thought', thought);
      sessionStorage.setItem('exhale_timer', timerSeconds.toString());
    } catch {
      // Ignore storage quota or access errors
    }
  }, [stage, thought, timerSeconds]);

  // Session timer countdown engine (active on 'thought', 'journey', 'breath', and 'drift')
  useEffect(() => {
    if (stage === 'thought' || stage === 'journey' || stage === 'breath' || stage === 'drift') {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [stage]);

  // Format seconds as MM:SS (e.g. 120 -> "2:00", 92 -> "1:32")
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formattedTimer = formatTimer(timerSeconds);

  // Navigation handlers
  const handleBegin = () => {
    // Keep Home and Thought Input quiet while typing
    setThought('');
    setTimerSeconds(INITIAL_TIMER_SECONDS);
    setCosmicExpansion(0);
    setStage('thought');
  };

  const handleBackToHome = () => {
    audioManager.stopAll(1.2);
    setCosmicExpansion(0);
    setStage('home');
  };

  const handleContinueThought = (enteredThought: string) => {
    // 1. Immediately start Meanwhile ambient music synchronously on user gesture
    audioManager.startMusicJourney();
    audioManager.playSpaceTransition();
    setThought(enteredThought);
    setStage('journey');
  };

  const handleBackToThought = () => {
    audioManager.onBackToThought();
    setStage('thought');
  };

  const handleReturnHome = () => {
    audioManager.stopAll(1.5);
    setThought('');
    setTimerSeconds(INITIAL_TIMER_SECONDS);
    setCosmicExpansion(0);
    try {
      sessionStorage.clear();
    } catch {
      // Ignore
    }
    setStage('home');
  };

  // Organic 850ms cinematic page transition with subtle scale continuity
  const pageTransition = {
    initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.985 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.85,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 1.015,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.65,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-between text-exhale-text selection:bg-exhale-violet/20">
      {/* Persistent Atmospheric Cosmic Canvas */}
      <CosmicBackground expansion={cosmicExpansion} />

      {/* 5-Stage Journey State Machine */}
      <AnimatePresence mode="wait">
        {stage === 'home' && (
          <motion.div key="home" {...pageTransition} className="w-full min-h-dvh">
            <HomeScreen onBegin={handleBegin} />
          </motion.div>
        )}

        {stage === 'thought' && (
          <motion.div key="thought" {...pageTransition} className="w-full min-h-dvh">
            <ThoughtInputScreen
              initialThought={thought}
              onBack={handleBackToHome}
              onContinue={handleContinueThought}
            />
          </motion.div>
        )}

        {(stage === 'journey' || stage === 'breath' || stage === 'drift' || stage === 'completion') && (
          <motion.div key="journey" {...pageTransition} className="w-full min-h-dvh">
            <CosmicJourney
              thought={thought}
              formattedTimer={formattedTimer}
              onBack={handleBackToThought}
              onReturnHome={handleReturnHome}
              onExpansionChange={setCosmicExpansion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

