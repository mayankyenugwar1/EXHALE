import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { audioManager } from '@/audio';

interface CosmicJourneyProps {
  thought: string;
  formattedTimer?: string;
  onBack: () => void;
  onReturnHome: () => void;
  onExpansionChange?: (expansion: number) => void;
}

type JourneyPhase =
  // 1. Guided Breathing Stage (~30s total)
  | 'arriving'          // 0s - 1.5s: Thought settles into space
  // Cycle 1 (14s)
  | 'inhale-1'          // 1.5s - 5.5s: Inhale (4s)
  | 'hold-1'            // 5.5s - 7.5s: Hold (2s)
  | 'exhale-1'          // 7.5s - 13.5s: Exhale (6s)
  | 'rest-1'            // 13.5s - 15.5s: Rest (2s)
  // Cycle 2 (14s)
  | 'inhale-2'          // 15.5s - 19.5s: Inhale (4s)
  | 'hold-2'            // 19.5s - 21.5s: Hold (2s)
  | 'exhale-2'          // 21.5s - 27.5s: Exhale (6s)
  | 'rest-2'            // 27.5s - 29.5s: Rest (2s)
  // Settle into stillness before drift
  | 'stillness'         // 29.5s - 31.5s: Breathing settles, quiet pause (2s)
  // 2. Continuous Cosmic Perspective Drift (8.5s continuous pull-back)
  | 'drift'             // 31.5s - 40.0s: Earth-to-deep-space camera pull-back
  | 'drift-star'        // 40.0s - 42.0s: Star alone in cosmic stillness (2s hold, no text)
  // 3. Phased Sequential Perspective Reveal
  | 'perspective-1'     // 42.0s - 43.8s: "It still exists. / It just isn't everything."
  | 'perspective-2'     // 43.8s - 46.0s: "A LITTLE MORE SPACE."
  | 'completion'        // 46.0s+: Return Home button appears
  // Legacy / subphase compatibility
  | 'hold-ex-1'
  | 'hold-ex-2'
  | 'inhale-3'
  | 'hold-3'
  | 'final-exhale'
  | 'drift-init'
  | 'drift-moving'
  | 'drift-smaller'
  | 'drift-pullback'
  | 'drift-point';

const BREATH_EASING = [0.37, 0, 0.63, 1]; // Gentle organic sine easing
const CINEMATIC_EASE = [0.25, 0.1, 0.25, 1.0]; // Slow, deliberate pull-back easing

interface SparseStar {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  tint: 'white' | 'lavender' | 'cyan';
  pulseDelay: number;
}

interface LocalDustParticle {
  id: number;
  x: number; // px offset
  y: number; // px offset
  size: number;
  delay: number;
}

/**
 * EXHALE — Final Perspective & Completion Polished Journey
 * 
 * Signature Moment:
 * "THE THOUGHT DID NOT DISAPPEAR.
 *  THE SPACE AROUND IT GOT BIGGER."
 * 
 * Key Visual & Spatial Design:
 * 1. Zero text/star overlap: The star is positioned cleanly above the perspective text.
 * 2. Phased sequential reveal: Star alone (2s hold) -> "It still exists..." -> "A LITTLE MORE SPACE." -> Return Home.
 * 3. Restrained breathing star: Subtle 6.5s micro-breathing without harsh flashes.
 * 4. Master spatial camera pull-back with sparse midground star field reveal.
 * 5. Refined translucent Return Home button matching the EXHALE identity.
 */
export const CosmicJourney: React.FC<CosmicJourneyProps> = ({
  thought,
  onBack,
  onReturnHome,
  onExpansionChange,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<JourneyPhase>(() => {
    try {
      const urlPhase = new URLSearchParams(window.location.search).get('phase');
      if (urlPhase) return urlPhase as JourneyPhase;
    } catch {}
    return 'arriving';
  });
  const [remainingBreathingSeconds, setRemainingBreathingSeconds] = useState<number>(30);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive mobile breakpoint detection (< 640px) for spatial composition
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fallback if empty thought was passed
  const displayThought = thought.trim() || 'I am worried about my future.';

  // Is currently inside breathing phase (first ~30s)
  const isBreathingStage =
    phase === 'arriving' ||
    phase === 'inhale-1' ||
    phase === 'hold-1' ||
    phase === 'exhale-1' ||
    phase === 'rest-1' ||
    phase === 'hold-ex-1' ||
    phase === 'inhale-2' ||
    phase === 'hold-2' ||
    phase === 'exhale-2' ||
    phase === 'rest-2' ||
    phase === 'hold-ex-2' ||
    phase === 'inhale-3' ||
    phase === 'hold-3' ||
    phase === 'final-exhale' ||
    phase === 'stillness';

  const isDrifting =
    phase === 'drift' ||
    phase === 'drift-moving' ||
    phase === 'drift-smaller' ||
    phase === 'drift-pullback' ||
    phase === 'drift-point';

  const isPostDrift =
    phase === 'drift-star' ||
    phase === 'perspective-1' ||
    phase === 'perspective-2' ||
    phase === 'completion';

  // Notify parent of cosmic expansion for the background star field
  // Subtle atmospheric depth response on inhale, calm settle on exhale/rest,
  // gentle 0.15 depth initiation during drift-init, then full 1.0 depth during drift.
  useEffect(() => {
    if (!onExpansionChange) return;

    if (isDrifting || isPostDrift) {
      onExpansionChange(1.0);
    } else if (phase === 'drift-init') {
      onExpansionChange(0.15);
    } else if (phase === 'inhale-1' || phase === 'inhale-2') {
      onExpansionChange(0.06);
    } else {
      onExpansionChange(0.0);
    }
  }, [phase, isDrifting, isPostDrift, onExpansionChange]);

  // Synchronize immersive breathing and cosmic audio with journey phase
  useEffect(() => {
    audioManager.onJourneyPhase(phase);
  }, [phase]);

  // Deterministic sparse midground stars revealed during camera pull-back
  const sparseMidgroundStars = useMemo<SparseStar[]>(() => {
    return [
      { id: 1, x: 22, y: 26, size: 1.5, tint: 'lavender', pulseDelay: 0.4 },
      { id: 2, x: 78, y: 22, size: 1.8, tint: 'white', pulseDelay: 1.2 },
      { id: 3, x: 18, y: 72, size: 1.4, tint: 'cyan', pulseDelay: 2.1 },
      { id: 4, x: 84, y: 74, size: 1.6, tint: 'white', pulseDelay: 0.8 },
      { id: 5, x: 38, y: 15, size: 1.3, tint: 'white', pulseDelay: 3.0 },
      { id: 6, x: 64, y: 84, size: 1.5, tint: 'lavender', pulseDelay: 1.7 },
      { id: 7, x: 26, y: 86, size: 1.2, tint: 'cyan', pulseDelay: 2.5 },
      { id: 8, x: 86, y: 36, size: 2.0, tint: 'white', pulseDelay: 1.0 },
      { id: 9, x: 12, y: 42, size: 1.4, tint: 'lavender', pulseDelay: 0.2 },
      { id: 10, x: 48, y: 20, size: 1.2, tint: 'white', pulseDelay: 1.9 },
      { id: 11, x: 74, y: 60, size: 1.6, tint: 'cyan', pulseDelay: 2.8 },
      { id: 12, x: 32, y: 50, size: 1.3, tint: 'white', pulseDelay: 0.6 },
      { id: 13, x: 60, y: 30, size: 1.5, tint: 'lavender', pulseDelay: 2.2 },
      { id: 14, x: 92, y: 54, size: 1.7, tint: 'white', pulseDelay: 1.4 },
      { id: 15, x: 40, y: 80, size: 1.4, tint: 'cyan', pulseDelay: 0.9 },
      { id: 16, x: 15, y: 16, size: 1.8, tint: 'white', pulseDelay: 2.6 },
      { id: 17, x: 82, y: 12, size: 1.3, tint: 'lavender', pulseDelay: 1.1 },
      { id: 18, x: 24, y: 36, size: 1.2, tint: 'white', pulseDelay: 3.2 },
      { id: 19, x: 68, y: 44, size: 1.4, tint: 'cyan', pulseDelay: 1.8 },
      { id: 20, x: 54, y: 88, size: 1.5, tint: 'white', pulseDelay: 0.5 },
    ];
  }, []);

  // Local Thought World dust particles (recede inward during drift)
  const localThoughtParticles = useMemo<LocalDustParticle[]>(() => [
    { id: 1, x: -95, y: -32, size: 1.4, delay: 0 },
    { id: 2, x: 88, y: -24, size: 1.2, delay: 0.5 },
    { id: 3, x: -68, y: 38, size: 1.5, delay: 1.0 },
    { id: 4, x: 76, y: 44, size: 1.3, delay: 1.5 },
    { id: 5, x: -128, y: 12, size: 1.1, delay: 0.8 },
    { id: 6, x: 118, y: -14, size: 1.4, delay: 2.0 },
    { id: 7, x: -35, y: -48, size: 1.2, delay: 1.2 },
    { id: 8, x: 44, y: 48, size: 1.3, delay: 0.3 },
  ], []);

  // 30-Second Breathing Countdown Timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setRemainingBreathingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Precise Phased Timeline Orchestration
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // If testing a specific phase via URL query, skip automated timer scheduling
    try {
      if (new URLSearchParams(window.location.search).get('phase')) {
        return;
      }
    } catch {}

    const schedulePhase = (targetPhase: JourneyPhase, delayMs: number) => {
      const timer = setTimeout(() => {
        setPhase(targetPhase);
      }, delayMs);
      timersRef.current.push(timer);
    };

    if (prefersReducedMotion) {
      // Streamlined timeline for reduced motion
      schedulePhase('inhale-1', 1500);
      schedulePhase('exhale-1', 5500);
      schedulePhase('inhale-2', 11500);
      schedulePhase('exhale-2', 15500);
      // Final exhale settles smoothly (1.0s)
      schedulePhase('stillness', 19500);
      // Transition into Drift (0.5s)
      schedulePhase('drift-init', 20500);
      // Continuous camera pull-back
      schedulePhase('drift', 21000);
      schedulePhase('drift-star', 23500);
      schedulePhase('perspective-1', 25500);
      schedulePhase('perspective-2', 27500);
      schedulePhase('completion', 29500);
    } else {
      // 1. Guided Breathing (4-2-6-2 rhythm, ~30s total)
      // Cycle 1 (14s)
      schedulePhase('inhale-1', 1500);   // 1.5s - 5.5s (4.0s)
      schedulePhase('hold-1', 5500);     // 5.5s - 7.5s (2.0s)
      schedulePhase('exhale-1', 7500);   // 7.5s - 13.5s (6.0s)
      schedulePhase('rest-1', 13500);    // 13.5s - 15.5s (2.0s)
      // Cycle 2: Final breath
      schedulePhase('inhale-2', 15500);  // 15.5s - 19.5s (4.0s)
      schedulePhase('hold-2', 19500);    // 19.5s - 21.5s (2.0s)
      schedulePhase('exhale-2', 21500);  // 21.5s - 27.5s (6.0s) Final exhale releasing tension
      // Final exhale settles: ~1.5 sec
      schedulePhase('stillness', 27500); // 27.5s - 29.0s (1.5s)
      // Transition into Drift: ~0.5 sec
      schedulePhase('drift-init', 29000); // 29.0s - 29.5s (0.5s)

      // 2. Continuous Cosmic Perspective Drift (8.5s continuous camera pull-back)
      schedulePhase('drift', 29500);     // 29.5s - 38.0s (8.5s)

      // 3. Thought condenses into star: held alone in cosmic stillness for 2.0s
      schedulePhase('drift-star', 38000); // 38.0s - 40.0s (2.0s)

      // 4. Phased Sequential Perspective Reveal
      schedulePhase('perspective-1', 40000); // 40.0s - 41.8s (1.8s)
      schedulePhase('perspective-2', 41800); // 41.8s - 44.0s (2.2s)
      schedulePhase('completion', 44000);    // 44.0s+
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [prefersReducedMotion]);

  // Responsive Top Instruction (fades out completely during drift for pure cosmic focus)
  const getInstructionText = (): string | null => {
    switch (phase) {
      case 'arriving':
        return 'Take a breath.';
      case 'inhale-1':
      case 'inhale-2':
      case 'inhale-3':
        return 'Inhale...';
      case 'hold-1':
      case 'hold-2':
      case 'hold-3':
        return 'Hold...';
      case 'exhale-1':
      case 'exhale-2':
      case 'final-exhale':
        return 'Exhale...';
      case 'rest-1':
      case 'rest-2':
      case 'hold-ex-1':
      case 'hold-ex-2':
        return 'Rest...';
      case 'drift':
      case 'drift-init':
        return 'Let it drift...';
      default:
        return null;
    }
  };

  const instructionText = getInstructionText();

  // Star Field Reveal Opacity
  const getStarFieldOpacity = (): number => {
    if (isDrifting || isPostDrift) return 1.0;
    if (phase === 'drift-init') return 0.15;
    return 0.0;
  };

  // Organic Orbital Glow Scale (Pure atmospheric gradient, zero geometric borders)
  const getOrbitalGlowScale = (): number => {
    switch (phase) {
      case 'arriving':
        return 1.0;
      case 'inhale-1':
      case 'inhale-2':
      case 'inhale-3':
        return 1.28;
      case 'hold-1':
      case 'hold-2':
      case 'hold-3':
        return 1.28;
      case 'exhale-1':
      case 'exhale-2':
      case 'final-exhale':
        return 0.94;
      case 'rest-1':
      case 'rest-2':
      case 'hold-ex-1':
      case 'hold-ex-2':
        return 0.96;
      case 'stillness':
        return 1.0;
      case 'drift-init':
        return 1.05;
      case 'drift':
        return 1.6;
      default:
        return 1.0;
    }
  };

  const getOrbitalGlowOpacity = (): number => {
    switch (phase) {
      case 'arriving':
        return 0.42;
      case 'inhale-1':
      case 'inhale-2':
      case 'inhale-3':
        return 0.72;
      case 'hold-1':
      case 'hold-2':
      case 'hold-3':
        return 0.72;
      case 'exhale-1':
      case 'exhale-2':
      case 'final-exhale':
        return 0.38;
      case 'rest-1':
      case 'rest-2':
      case 'hold-ex-1':
      case 'hold-ex-2':
        return 0.38;
      case 'stillness':
        return 0.40;
      case 'drift-init':
        return 0.35;
      case 'drift':
        return 0.08;
      case 'drift-star':
      case 'perspective-1':
      case 'perspective-2':
      case 'completion':
        return 0.03;
      default:
        return 0.06;
    }
  };

  // Animation Transition Duration per phase
  const getPhaseDuration = (): number => {
    if (prefersReducedMotion) return 0.4;
    switch (phase) {
      case 'inhale-1':
      case 'inhale-2':
      case 'inhale-3':
        return 4.0;
      case 'hold-1':
      case 'hold-2':
      case 'hold-3':
        return 2.0;
      case 'exhale-1':
      case 'exhale-2':
      case 'final-exhale':
        return 6.0;
      case 'rest-1':
      case 'rest-2':
      case 'hold-ex-1':
      case 'hold-ex-2':
        return 2.0;
      case 'stillness':
        return 1.5;
      case 'drift-init':
        return 0.5;
      case 'drift':
        return 8.5;
      case 'drift-star':
        return 2.0;
      case 'perspective-1':
        return 1.8;
      case 'perspective-2':
        return 2.2;
      case 'completion':
        return 1.5;
      default:
        return 1.5;
    }
  };

  const currentDuration = getPhaseDuration();
  const formattedCountdown = `0:${remainingBreathingSeconds < 10 ? '0' : ''}${remainingBreathingSeconds}`;

  // Master Framer Motion Keyframes for Continuous Earth-to-deep-space Perspective Drift
  const thoughtWorldVariants = {
    breathing: (customScale: number) => ({
      scale: customScale,
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: currentDuration,
        ease: BREATH_EASING,
      },
    }),
    driftInit: {
      scale: 1.0,
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    drift: {
      scale: prefersReducedMotion
        ? [1.0, 0.60, 0.20]
        : [1.0, 0.90, 0.70, 0.40, 0.22, 0.18],
      x: 0,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 2.5 : 8.5,
        times: prefersReducedMotion
          ? [0, 0.50, 1.0]
          : [0, 0.15, 0.40, 0.70, 0.90, 1.0],
        ease: CINEMATIC_EASE,
      },
    },
    postDrift: {
      scale: 0.18,
      opacity: 0,
      x: 0,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const textVariants = {
    breathing: {
      opacity: 1.0,
      filter: 'blur(0px)',
      transition: { duration: 0.4 },
    },
    drift: {
      opacity: prefersReducedMotion
        ? [1.0, 1.0, 0.0]
        : [1.0, 1.0, 1.0, 1.0, 0.95, 0.45, 0.0],
      filter: prefersReducedMotion
        ? ['blur(0px)', 'blur(0px)', 'blur(1.5px)']
        : [
            'blur(0px)',
            'blur(0px)',
            'blur(0px)',
            'blur(0px)',
            'blur(0px)',
            'blur(1.2px)',
            'blur(2.5px)',
          ],
      transition: {
        duration: prefersReducedMotion ? 2.5 : 8.5,
        times: prefersReducedMotion
          ? [0, 0.75, 1.0]
          : [0, 0.20, 0.50, 0.70, 0.82, 0.92, 1.0],
        ease: CINEMATIC_EASE,
      },
    },
    postDrift: {
      opacity: 0.0,
      filter: 'blur(2px)',
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const starVariants = {
    breathing: {
      opacity: 0,
      scale: 0.1,
      x: 0,
      y: 0,
    },
    drift: {
      opacity: prefersReducedMotion
        ? [0, 0, 1.0]
        : [0, 0, 0, 0, 0.20, 0.80, 1.0],
      scale: prefersReducedMotion
        ? [0.2, 0.2, 1.0]
        : [0.1, 0.1, 0.1, 0.20, 0.55, 0.88, 1.0],
      x: 0,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 2.5 : 8.5,
        times: prefersReducedMotion
          ? [0, 0.75, 1.0]
          : [0, 0.20, 0.50, 0.70, 0.82, 0.92, 1.0],
        ease: CINEMATIC_EASE,
      },
    },
    postDrift: {
      opacity: 1.0,
      scale: 1.0,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <main className="relative flex flex-col justify-between min-h-dvh w-full px-4 sm:px-6 pt-safe pb-safe select-none overflow-hidden touch-none overscroll-none">
      {/* 1. Top Navigation: Subtle Back Arrow & Breathing Countdown */}
      <header className="w-full flex justify-between items-center max-w-2xl mx-auto z-30 pt-1 sm:pt-2">
        <button
          onClick={onBack}
          className="group inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 -ml-2 text-slate-400 hover:text-white 
            transition-all duration-300 rounded-full active:scale-[0.93] touch-manipulation focus-visible:outline-none focus-visible:ring-1 
            focus-visible:ring-[#a78bfa]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]"
          style={{ opacity: !isBreathingStage ? 0.35 : 0.8 }}
          aria-label="Return to thought input"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-3">
          <SoundToggle />
          {/* Breathing Timer (Starts at 0:30, counts down, softly fades out when drift begins) */}
          <motion.div
            animate={{ opacity: isBreathingStage ? 0.75 : 0 }}
            transition={{ duration: 1.5 }}
            className="font-mono text-xs tracking-widest text-[#a78bfa]/75 font-light"
            aria-label="Remaining breathing duration"
          >
            {formattedCountdown}
          </motion.div>
        </div>
      </header>

      {/* 2. FIXED SCREEN-SPACE CONTAINER (Fixed viewport space; UI elements remain unscaled) */}
      <div className="relative flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full h-full min-h-[440px] z-10 my-auto">
        {/* MIDGROUND LAYER: Sparse Star Field Revealed during Camera Pull-Back */}
        <motion.div
          animate={{ opacity: getStarFieldOpacity() }}
          transition={{ duration: 4.0, ease: 'easeInOut' }}
          className="absolute inset-0 pointer-events-none"
        >
          {sparseMidgroundStars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor:
                  star.tint === 'white'
                    ? '#ffffff'
                    : star.tint === 'lavender'
                    ? '#d8b4fe'
                    : '#93c5fd',
                boxShadow:
                  star.tint === 'white'
                    ? '0 0 8px rgba(255, 255, 255, 0.9)'
                    : star.tint === 'lavender'
                    ? '0 0 6px rgba(216, 180, 254, 0.8)'
                    : '0 0 6px rgba(147, 197, 253, 0.8)',
              }}
              animate={
                !prefersReducedMotion
                  ? {
                      opacity: [0.35, 0.95, 0.35],
                      scale: [0.9, 1.15, 0.9],
                    }
                  : false
              }
              transition={{
                duration: 4.5 + star.pulseDelay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: star.pulseDelay,
              }}
            />
          ))}
        </motion.div>

        {/* FOREGROUND LAYER 1: Deep Cosmic Atmospheric Field (Expanding through Space) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="rounded-full pointer-events-none mix-blend-screen"
            style={{
              width: 'min(92vw, 560px)',
              height: 'min(92vw, 560px)',
              background:
                'radial-gradient(circle at center, rgba(107, 123, 255, 0.22) 0%, rgba(124, 58, 237, 0.14) 38%, rgba(76, 29, 149, 0.04) 70%, transparent 100%)',
              filter: 'blur(54px)',
            }}
            animate={{
              scale: getOrbitalGlowScale() * 1.15,
              opacity: getOrbitalGlowOpacity() * 0.85,
            }}
            transition={{
              duration: currentDuration,
              ease: isBreathingStage ? BREATH_EASING : CINEMATIC_EASE,
            }}
          />
        </div>

        {/* FOREGROUND LAYER 2: Core Diffuse Breathing Field (Centered Directly Around Thought) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="rounded-full pointer-events-none mix-blend-screen"
            style={{
              width: 'min(80vw, 420px)',
              height: 'min(80vw, 420px)',
              background:
                'radial-gradient(circle at center, rgba(196, 181, 253, 0.36) 0%, rgba(167, 139, 250, 0.22) 35%, rgba(107, 123, 255, 0.08) 65%, transparent 100%)',
              filter: 'blur(36px)',
            }}
            animate={{
              scale: getOrbitalGlowScale(),
              opacity: getOrbitalGlowOpacity(),
            }}
            transition={{
              duration: currentDuration,
              ease: isBreathingStage ? BREATH_EASING : CINEMATIC_EASE,
            }}
          />
        </div>

        {/* Top Breathing Guidance (INHALE... / HOLD... / EXHALE... / LET IT DRIFT...) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-full pointer-events-none h-12"
          style={{
            top: isMobile ? 'calc(50% - 105px)' : 'calc(50% - 125px)',
          }}
        >
          <AnimatePresence mode="wait">
            {instructionText && (
              <motion.p
                key={instructionText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="font-sans text-xs sm:text-sm uppercase tracking-[0.3em] font-light text-[#a78bfa]/90 drop-shadow-[0_0_12px_rgba(167,139,250,0.35)]"
              >
                {instructionText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 3. THE PROTAGONIST: The User's Exact Thought & Thought World */}
        {/* The entire thought world (text, diffuse aura, local stardust) recedes along camera z-axis */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            variants={thoughtWorldVariants}
            animate={
              phase === 'drift-init'
                ? 'driftInit'
                : isDrifting
                ? 'drift'
                : isPostDrift
                ? 'postDrift'
                : 'breathing'
            }
            custom={
              isBreathingStage
                ? (phase.startsWith('inhale') || (phase.startsWith('hold-') && !phase.includes('ex'))
                  ? 1.03
                  : (phase.startsWith('exhale') || phase === 'final-exhale'
                    ? 0.98
                    : 1.0))
                : 1.0
            }
            className="relative z-20 flex flex-col items-center justify-center text-center select-none pointer-events-none"
          >
            {/* Thought World Local Micro-Dust: Swarms softly around thought, then condenses inward */}
            {!prefersReducedMotion && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {localThoughtParticles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-[#d8b4fe]/60 shadow-[0_0_6px_rgba(216,180,254,0.6)] pointer-events-none"
                    style={{
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      left: `calc(50% + ${particle.x}px)`,
                      top: `calc(50% + ${particle.y}px)`,
                    }}
                    animate={
                      isPostDrift
                        ? { opacity: 0, scale: 0 }
                        : isDrifting
                        ? {
                            opacity: [0.55, 0.50, 0.40, 0.25, 0.12, 0.0],
                            scale: [1.0, 0.90, 0.70, 0.45, 0.25, 0.0],
                          }
                        : {
                            opacity: [0.25, 0.60, 0.25],
                            scale: [0.85, 1.15, 0.85],
                          }
                    }
                    transition={
                      isDrifting
                        ? {
                            duration: prefersReducedMotion ? 2.5 : 8.5,
                            times: prefersReducedMotion ? [0, 0.50, 1.0] : [0, 0.15, 0.40, 0.70, 0.90, 1.0],
                            ease: CINEMATIC_EASE,
                          }
                        : isPostDrift
                        ? { duration: 0.2 }
                        : {
                            duration: 3.5 + particle.delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: particle.delay,
                          }
                    }
                  />
                ))}
              </div>
            )}

            {/* Thought Atmospheric Halo: Diffuse, soft, breathes with user and recedes into deep space */}
            <motion.div
              className="absolute inset-0 -m-6 sm:-m-10 rounded-full pointer-events-none -z-10 mix-blend-screen"
              style={{
                background:
                  'radial-gradient(ellipse 75% 65% at center, rgba(216, 180, 254, 0.28) 0%, rgba(167, 139, 250, 0.16) 42%, rgba(99, 102, 241, 0.05) 72%, transparent 100%)',
                filter: 'blur(20px)',
              }}
              animate={
                isDrifting
                  ? {
                      opacity: [0.35, 0.30, 0.22, 0.16, 0.26, 0.45, 0.0],
                      scale: [1.0, 0.90, 0.70, 0.40, 0.25, 0.10, 0.0],
                    }
                  : {
                      scale: isBreathingStage || phase === 'drift-init' ? getOrbitalGlowScale() : 0.8,
                      opacity: isBreathingStage || phase === 'drift-init' ? getOrbitalGlowOpacity() * 0.95 : 0,
                    }
              }
              transition={
                isDrifting
                  ? {
                      duration: prefersReducedMotion ? 2.5 : 8.5,
                      times: prefersReducedMotion ? [0, 0.50, 1.0] : [0, 0.20, 0.50, 0.70, 0.82, 0.92, 1.0],
                      ease: CINEMATIC_EASE,
                    }
                  : {
                      duration: currentDuration,
                      ease: isBreathingStage ? BREATH_EASING : CINEMATIC_EASE,
                    }
              }
            />

            {/* Thought Condensation Core: Visual energy gathering at the center as words dissolve */}
            {isDrifting && (
              <motion.div
                className="absolute w-7 h-7 rounded-full pointer-events-none mix-blend-screen"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(216,180,254,0.65) 35%, rgba(167,139,250,0.2) 65%, transparent 100%)',
                }}
                animate={{
                  opacity: prefersReducedMotion
                    ? [0, 0, 0]
                    : [0, 0, 0, 0.15, 0.82, 0.95, 0.0],
                  scale: prefersReducedMotion
                    ? [0.5, 0.5, 0.5]
                    : [1.5, 1.5, 1.2, 0.90, 0.45, 0.20, 0.0],
                }}
                transition={{
                  duration: prefersReducedMotion ? 2.5 : 8.5,
                  times: prefersReducedMotion
                    ? [0, 0.75, 1.0]
                    : [0, 0.20, 0.50, 0.70, 0.82, 0.92, 1.0],
                  ease: CINEMATIC_EASE,
                }}
              />
            )}

            {/* The Thought Text: The protagonist receding smoothly into deep space */}
            <motion.div
              variants={textVariants}
              animate={isDrifting ? 'drift' : (isPostDrift ? 'postDrift' : 'breathing')}
              className="max-w-[90vw] sm:max-w-xl px-6 py-4 flex items-center justify-center pointer-events-none"
            >
              <p className="font-sans text-lg sm:text-2xl md:text-3xl font-light text-[#f0f2ff] tracking-wide leading-relaxed text-center break-words drop-shadow-[0_0_24px_rgba(230,230,255,0.65)] drop-shadow-[0_0_50px_rgba(107,123,255,0.40)]">
                {displayThought}
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* 4. TRANSFORMED DISTANT STAR (✦): Awakens as thought condenses, settles cleanly in cosmic stillness */}
        {(isDrifting || isPostDrift) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              variants={starVariants}
              animate={isDrifting ? 'drift' : 'postDrift'}
              className="z-25 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                animate={
                  !prefersReducedMotion && isPostDrift
                    ? {
                        scale: [1, 1.06, 1],
                        opacity: [0.88, 1, 0.88],
                      }
                    : false
                }
                transition={{
                  duration: 6.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative flex items-center justify-center"
              >
                {/* Luminous Center Point */}
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#ffffff,0_0_18px_#c4b5fd,0_0_28px_#818cf8]" />
                {/* Atmospheric restrained halo */}
                <div className="absolute w-8 h-8 rounded-full bg-[#a78bfa]/22 blur-sm pointer-events-none" />

                {/* 4-Point Cross Flare Rays (Blooms open upon settling into drift-star) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.1 }}
                  animate={{
                    opacity: isPostDrift ? 0.92 : 0,
                    scale: isPostDrift ? 1 : 0.1,
                  }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="absolute w-12 h-[1px] bg-gradient-to-r from-transparent via-white/85 to-transparent opacity-90 pointer-events-none" />
                  <div className="absolute w-[1px] h-12 bg-gradient-to-b from-transparent via-white/85 to-transparent opacity-90 pointer-events-none" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* 5. SEQUENTIAL PERSPECTIVE REVEAL & ACTIONS (Positioned cleanly below the star) */}
        {/* Preferred composition: Star at top -> Primary realization -> Supporting line -> Return Home */}
        <div
          className="absolute z-30 flex flex-col items-center justify-start text-center w-full max-w-[88vw] sm:max-w-lg md:max-w-xl px-4 sm:px-6 pointer-events-none left-1/2 -translate-x-1/2"
          style={{
            top: isMobile ? 'calc(50% + 34px)' : 'calc(50% + 40px)',
          }}
        >
          <AnimatePresence>
            {/* Step 1: "It still exists. / It just isn't everything." (15-20% smaller, delicate realization) */}
            {(phase === 'perspective-1' || phase === 'perspective-2' || phase === 'completion') && (
              <motion.div
                key="perspective-message-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <h2 className="font-sans text-base sm:text-xl md:text-2xl lg:text-[1.75rem] font-light text-[#f0f2ff] tracking-wide leading-relaxed sm:leading-relaxed text-center drop-shadow-[0_0_20px_rgba(230,230,255,0.4)] drop-shadow-[0_0_40px_rgba(167,139,250,0.2)] select-none">
                  It still exists.<br />
                  It just isn't everything.
                </h2>
              </motion.div>
            )}

            {/* Step 2: "A LITTLE MORE SPACE." (15-20% smaller, subtle lavender uppercase) */}
            {(phase === 'perspective-2' || phase === 'completion') && (
              <motion.div
                key="perspective-message-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-center mt-3 sm:mt-4"
              >
                <p className="font-sans text-[10px] sm:text-xs md:text-[13px] font-light text-[#a78bfa]/80 tracking-[0.24em] sm:tracking-[0.28em] uppercase drop-shadow-[0_0_12px_rgba(167,139,250,0.25)]">
                  A little more space.
                </p>
              </motion.div>
            )}

            {/* Step 3: Refined Return Home Action Button (15-20% smaller, delicate and integrated) */}
            {phase === 'completion' && (
              <motion.div
                key="completion-action"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 sm:mt-8 pointer-events-auto"
              >
                <button
                  onClick={onReturnHome}
                  className="group relative inline-flex items-center justify-center gap-2 min-h-[44px] px-6 sm:px-7 py-3 rounded-full
                    bg-[#0b1b3d]/35 hover:bg-[#0b1b3d]/65 backdrop-blur-md
                    border border-[#6b7bff]/30 hover:border-[#a78bfa]/60
                    shadow-[0_0_18px_rgba(107,123,255,0.12)] hover:shadow-[0_0_26px_rgba(167,139,250,0.25)]
                    transition-all duration-500 text-[11px] sm:text-xs font-light tracking-[0.22em] text-[#e6e6ff] hover:text-white uppercase
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#a78bfa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]
                    active:scale-[0.96] touch-manipulation select-none"
                  aria-label="Return to Home screen"
                >
                  <span>Return Home</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" strokeWidth={1.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};
