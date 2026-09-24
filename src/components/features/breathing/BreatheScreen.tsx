import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface BreatheScreenProps {
  onBack: () => void;
  onCompleteBreathing?: () => void;
  thought?: string;
  formattedTimer?: string;
}

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

const INHALE_DURATION = 4000;
const HOLD_DURATION = 2000;
const EXHALE_DURATION = 6000;
const TOTAL_CYCLES_NEEDED = 2; // 2 complete 12s cycles (24s meditative breathing)

// Extremely smooth, organic easing curve for meditative breath motion
const BREATH_EASING: [number, number, number, number] = [0.4, 0.0, 0.2, 1.0];

/**
 * EXHALE Breathe Screen Component:
 * 
 * Pixel Thoughts × EXHALE:
 * The user's entered thought is the primary visual protagonist.
 * Sizing: 280-320px on desktop, 220-260px on mobile.
 * Rhythm: 4s INHALE -> 2s HOLD -> 6s EXHALE (12s total cycle).
 */
export const BreatheScreen: React.FC<BreatheScreenProps> = ({
  onBack,
  onCompleteBreathing,
  thought = '',
  formattedTimer = '2:00',
}) => {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const cycleCountRef = useRef<number>(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStartTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayThought = thought.trim() || 'I am worried about my future.';

  const startBreathingCycle = useCallback(() => {
    setPhase('inhale');

    // Inhale (4s) -> Hold
    timerRef.current = setTimeout(() => {
      setPhase('hold');

      // Hold (2s) -> Exhale
      timerRef.current = setTimeout(() => {
        setPhase('exhale');

        // Exhale (6s) -> Next cycle or complete
        timerRef.current = setTimeout(() => {
          cycleCountRef.current += 1;
          if (cycleCountRef.current >= TOTAL_CYCLES_NEEDED) {
            setPhase('complete');
            timerRef.current = setTimeout(() => {
              if (onCompleteBreathing) {
                onCompleteBreathing();
              }
            }, 1200);
          } else {
            // Repeat cycle smoothly
            startBreathingCycle();
          }
        }, EXHALE_DURATION);
      }, HOLD_DURATION);
    }, INHALE_DURATION);
  }, [onCompleteBreathing]);

  // Handle auto-start with a gentle 1.2s entrance delay
  useEffect(() => {
    autoStartTimerRef.current = setTimeout(() => {
      startBreathingCycle();
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (autoStartTimerRef.current) clearTimeout(autoStartTimerRef.current);
    };
  }, [startBreathingCycle]);

  const handleManualStart = () => {
    if (phase === 'idle' || phase === 'complete') {
      if (autoStartTimerRef.current) clearTimeout(autoStartTimerRef.current);
      cycleCountRef.current = 0;
      startBreathingCycle();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.25,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 1.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Organic scaling & luminosity per breathing phase
  const orbScale = {
    idle: 1,
    inhale: 1.18,
    hold: 1.18,
    exhale: 0.96,
    complete: 1.05,
  }[phase];

  const orbGlowOpacity = {
    idle: 0.35,
    inhale: 0.85,
    hold: 0.85,
    exhale: 0.3,
    complete: 0.6,
  }[phase];

  const phaseText = {
    idle: 'Breathe',
    inhale: 'Inhale...',
    hold: 'Hold...',
    exhale: 'Exhale...',
    complete: 'Let it drift...',
  }[phase];

  const getPhaseDuration = (currentPhase: BreathPhase): number => {
    switch (currentPhase) {
      case 'inhale':
        return INHALE_DURATION / 1000;
      case 'hold':
        return HOLD_DURATION / 1000;
      case 'exhale':
        return EXHALE_DURATION / 1000;
      default:
        return 1.2;
    }
  };

  const currentDuration = getPhaseDuration(phase);

  return (
    <main className="relative flex flex-col justify-between min-h-dvh w-full px-6 py-6 sm:py-10 select-none overflow-hidden">
      {/* 1. Header Navigation: Minimal Back Button & Session Timer */}
      <header className="w-full flex justify-between items-center max-w-xl mx-auto z-10 pt-2">
        <button
          onClick={onBack}
          className="group inline-flex items-center justify-center p-2.5 -ml-2 text-slate-400 hover:text-white 
            transition-colors duration-300 rounded-full focus-visible:outline-none focus-visible:ring-1 
            focus-visible:ring-[#a78bfa]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]"
          aria-label="Return to Thought Input screen"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
        </button>

        <div
          className="font-mono text-xs tracking-widest text-[#a78bfa]/75 font-light"
          aria-label="Session duration timer indicator"
        >
          {formattedTimer}
        </div>
      </header>

      {/* 2. Main Centered Breathing Composition */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center max-w-xl mx-auto my-auto py-4 z-10 w-full"
      >
        {/* Secondary Heading & Subtitle */}
        <motion.div variants={itemVariants} className="text-center space-y-2 mb-6 sm:mb-10">
          <h1 className="font-sans text-2xl sm:text-3xl font-light text-[#e6e6ff] tracking-wide leading-tight drop-shadow-[0_0_16px_rgba(167,139,250,0.25)]">
            Take a breath.
          </h1>
          <p className="font-sans text-xs sm:text-sm font-light text-[#a78bfa]/75 tracking-wider">
            Inhale... and exhale...
          </p>
        </motion.div>

        {/* 3. Floating Cosmic Container with User's Thought (Hero Protagonist) */}
        <motion.div variants={itemVariants} className="relative flex items-center justify-center my-4">
          {/* Outer Cosmic Haze Backing */}
          <motion.div
            className="absolute rounded-full bg-[#a78bfa]/15 blur-3xl pointer-events-none"
            style={{ width: '135%', height: '135%' }}
            animate={{
              scale: prefersReducedMotion ? 1 : orbScale * 1.08,
              opacity: prefersReducedMotion ? 0.35 : orbGlowOpacity,
            }}
            transition={{
              duration: currentDuration,
              ease: BREATH_EASING,
            }}
          />

          {/* Inner Luminous Halo */}
          <motion.div
            className="absolute rounded-full bg-[#6b7bff]/20 blur-2xl pointer-events-none"
            style={{ width: '115%', height: '115%' }}
            animate={{
              scale: prefersReducedMotion ? 1 : orbScale * 1.04,
              opacity: prefersReducedMotion ? 0.4 : orbGlowOpacity,
            }}
            transition={{
              duration: currentDuration,
              ease: BREATH_EASING,
            }}
          />

          {/* Core Interactive Cosmic Orb with User's Thought (Hero Element) */}
          <motion.div
            onClick={handleManualStart}
            role="button"
            tabIndex={0}
            aria-label={`Breathing orb containing your thought: ${displayThought}. Click to start or follow breathing rhythm.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleManualStart();
              }
            }}
            className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-88 md:h-88 rounded-full bg-[#0b1b3d]/70 backdrop-blur-xl 
              border-2 border-[#6b7bff]/65 shadow-[0_0_55px_rgba(107,123,255,0.4),inset_0_0_35px_rgba(107,123,255,0.25)] 
              hover:border-[#a78bfa]/80 hover:shadow-[0_0_65px_rgba(167,139,250,0.45),inset_0_0_40px_rgba(167,139,250,0.3)] transition-all duration-500
              flex flex-col items-center justify-center p-6 sm:p-8 text-center cursor-pointer select-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050814]"
            animate={{
              scale: prefersReducedMotion ? 1 : orbScale,
            }}
            transition={{
              duration: currentDuration,
              ease: BREATH_EASING,
            }}
          >
            {/* The User's Actual Thought (Primary Content - Centered & Prominent) */}
            <motion.div
              animate={{
                scale: prefersReducedMotion ? 1 : orbScale * 0.95,
              }}
              transition={{
                duration: currentDuration,
                ease: BREATH_EASING,
              }}
              className="px-4 py-2 max-w-[92%] flex items-center justify-center text-center"
            >
              <p className="font-sans text-base sm:text-lg md:text-xl font-light text-[#e6e6ff] leading-relaxed text-center drop-shadow-[0_0_16px_rgba(230,230,255,0.4)]">
                {displayThought}
              </p>
            </motion.div>

            {/* Secondary Phase Indicator */}
            <AnimatePresence mode="wait">
              <motion.span
                key={phaseText}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 0.75, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="font-sans text-[11px] sm:text-xs font-light tracking-[0.22em] text-[#a78bfa] mt-3 uppercase"
              >
                {phaseText}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </main>
  );
};

