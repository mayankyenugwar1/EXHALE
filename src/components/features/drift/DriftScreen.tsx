import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface DriftScreenProps {
  thought: string;
  onBack: () => void;
  onCompleteDrift: () => void;
  formattedTimer?: string;
}

type DriftPhase = 'settle' | 'drifting' | 'pullback' | 'vortex' | 'starPoint';

/**
 * EXHALE Drifting Screen Component (Screen 4):
 * 
 * Central metaphor of EXHALE:
 * THOUGHT → DISTANCE → PERSPECTIVE
 * 
 * Implements a multi-layered, cinematic spatial camera pull-back:
 * - Phase 1 (0-3s): Thought settles clearly in foreground view.
 * - Phase 2 (3-10s): Thought begins drifting into the cosmic field.
 * - Phase 3 (10-20s): Camera pulls back into deep space; environment expands, thought recedes.
 * - Phase 4 (20-30s): Thought merges into the swirling cosmic vortex arms.
 * - Phase 5 (30-40s+): Thought transforms into a tiny, luminous star point inside the universe.
 */
export const DriftScreen: React.FC<DriftScreenProps> = ({
  thought,
  onBack,
  onCompleteDrift,
  formattedTimer = '1:32',
}) => {
  const [driftPhase, setDriftPhase] = useState<DriftPhase>('settle');
  const [isReadyToContinue, setIsReadyToContinue] = useState<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Display thought or fallback
  const displayThought = thought.trim() || 'I am worried about my future.';

  // Cinematic Timeline Sequence
  useEffect(() => {
    if (prefersReducedMotion) {
      setDriftPhase('starPoint');
      setIsReadyToContinue(true);
      return;
    }

    // Phase 1 -> Phase 2 (at 3s)
    const timer1 = setTimeout(() => {
      setDriftPhase('drifting');
    }, 3000);

    // Phase 2 -> Phase 3 (at 8s)
    const timer2 = setTimeout(() => {
      setDriftPhase('pullback');
    }, 8000);

    // Phase 3 -> Phase 4 (at 15s)
    const timer3 = setTimeout(() => {
      setDriftPhase('vortex');
    }, 15000);

    // Phase 4 -> Phase 5: Becomes a star point (at 22s)
    const timer4 = setTimeout(() => {
      setDriftPhase('starPoint');
      setIsReadyToContinue(true);
    }, 22000);

    // Phase 5 -> Automatic transition to Completion (at 27s)
    const timer5 = setTimeout(() => {
      onCompleteDrift();
    }, 27000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [prefersReducedMotion, onCompleteDrift]);

  // Spatial Camera Pull-back values per phase
  const cameraScale = {
    settle: 1.0,
    drifting: 0.92,
    pullback: 0.72,
    vortex: 0.48,
    starPoint: 0.32,
  }[driftPhase];

  const thoughtCapsuleScale = {
    settle: 1.0,
    drifting: 0.82,
    pullback: 0.52,
    vortex: 0.28,
    starPoint: 0.08,
  }[driftPhase];

  const thoughtCapsuleOpacity = {
    settle: 0.95,
    drifting: 0.9,
    pullback: 0.75,
    vortex: 0.5,
    starPoint: 0.15,
  }[driftPhase];

  const vortexScale = {
    settle: 0.85,
    drifting: 1.0,
    pullback: 1.18,
    vortex: 1.35,
    starPoint: 1.45,
  }[driftPhase];

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

  return (
    <main className="relative flex flex-col justify-between min-h-dvh w-full px-6 py-6 sm:py-10 select-none overflow-hidden">
      {/* 1. Header Navigation: Minimal Back Arrow & Timer */}
      <header className="w-full flex justify-between items-center max-w-xl mx-auto z-10 pt-2">
        <button
          onClick={onBack}
          className="group inline-flex items-center justify-center p-2.5 -ml-2 text-slate-400 hover:text-white 
            transition-colors duration-300 rounded-full focus-visible:outline-none focus-visible:ring-1 
            focus-visible:ring-[#a78bfa]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]"
          aria-label="Return to Breathing screen"
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

      {/* 2. Main Centered Drifting Cosmos Experience */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center max-w-xl mx-auto my-auto py-4 z-10 w-full"
      >
        {/* Subtle Perspective Copy (Fades in during later pullback stage) */}
        <motion.div
          animate={{
            opacity: driftPhase === 'settle' ? 0.35 : 1,
          }}
          transition={{ duration: 1.5 }}
          className="text-center space-y-2 mb-6 sm:mb-8"
        >
          <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-light text-[#e6e6ff] tracking-wide leading-tight drop-shadow-[0_0_16px_rgba(167,139,250,0.25)]">
            Let it drift.
          </h1>
          <p className="font-sans text-xs sm:text-sm font-light text-[#a78bfa]/75 tracking-wider leading-relaxed">
            Your thought is still there.<br />It just isn't everything.
          </p>
        </motion.div>

        {/* 3. Layered Spatial Camera & Swirling Cosmic Galaxy Vortex */}
        <motion.div
          variants={itemVariants}
          className="relative w-80 h-80 sm:w-[26rem] sm:h-[26rem] md:w-[30rem] md:h-[30rem] flex items-center justify-center my-2"
        >
          {/* Spatial Depth Wrapper simulating Camera Pull-Back */}
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            animate={{
              scale: prefersReducedMotion ? 1 : cameraScale,
            }}
            transition={{
              duration: 8,
              ease: [0.37, 0, 0.63, 1], // Smooth organic easeInOut curve
            }}
          >
            {/* Background: Swirling Cosmic Vortex Nebula */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none opacity-85"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(11, 27, 61, 0.4) 0%, rgba(107, 123, 255, 0.3) 35%, rgba(167, 139, 250, 0.4) 65%, rgba(76, 29, 149, 0.2) 85%, transparent 100%)',
                filter: 'blur(36px)',
              }}
              animate={
                !prefersReducedMotion
                  ? {
                      rotate: [0, 360],
                      scale: vortexScale,
                    }
                  : false
              }
              transition={{
                rotate: { duration: 54, repeat: Infinity, ease: 'linear' },
                scale: { duration: 8, ease: [0.37, 0, 0.63, 1] },
              }}
            />

            {/* Midground: Dual-Rotating SVG Spiral Vortex Dust Arms */}
            <svg
              viewBox="0 0 340 340"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-75"
            >
              <defs>
                <linearGradient id="vortexArmGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6b7bff" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#0b1b3d" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="vortexArmGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e6e6ff" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#6b7bff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0b1b3d" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <motion.path
                d="M 170 170 C 150 120, 90 110, 70 155 C 50 200, 85 270, 150 280 C 230 290, 295 235, 285 155 C 275 75, 205 30, 125 45"
                stroke="url(#vortexArmGrad1)"
                strokeWidth="2.8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="5 7"
                animate={!prefersReducedMotion ? { rotate: 360 } : false}
                transition={{ duration: 64, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '170px 170px' }}
              />

              <motion.path
                d="M 170 170 C 190 220, 250 230, 270 185 C 290 140, 255 70, 190 60 C 110 50, 45 105, 55 185 C 65 265, 135 310, 215 295"
                stroke="url(#vortexArmGrad2)"
                strokeWidth="2.0"
                fill="none"
                strokeLinecap="round"
                opacity="0.65"
                animate={!prefersReducedMotion ? { rotate: -360 } : false}
                transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '170px 170px' }}
              />
            </svg>

            {/* Midground: Cosmic Particle Stream along Spiral Path */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={!prefersReducedMotion ? { rotate: [0, 360] } : false}
              transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute top-12 left-1/4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
              <div className="absolute bottom-16 right-1/4 w-1 h-1 rounded-full bg-[#a78bfa] shadow-[0_0_6px_#a78bfa]" />
              <div className="absolute top-1/3 right-12 w-1.5 h-1.5 rounded-full bg-[#6b7bff] shadow-[0_0_8px_#6b7bff]" />
              <div className="absolute bottom-1/3 left-16 w-1 h-1 rounded-full bg-[#e6e6ff] shadow-[0_0_5.px_#e6e6ff]" />
            </motion.div>

            {/* Foreground -> Midground: The User's Floating Thought Capsule */}
            <motion.div
              animate={{
                scale: prefersReducedMotion ? 0.35 : thoughtCapsuleScale,
                opacity: prefersReducedMotion ? 0.4 : thoughtCapsuleOpacity,
                x: prefersReducedMotion ? 30 : {
                  settle: 0,
                  drifting: 18,
                  pullback: 42,
                  vortex: 65,
                  starPoint: 85,
                }[driftPhase],
                y: prefersReducedMotion ? 15 : {
                  settle: 0,
                  drifting: 10,
                  pullback: 25,
                  vortex: 40,
                  starPoint: 55,
                }[driftPhase],
              }}
              transition={{
                duration: 7.5,
                ease: [0.37, 0, 0.63, 1],
              }}
              className="z-20 max-w-[260px] sm:max-w-[340px] px-6 py-4.5 rounded-full 
                bg-[#0b1b3d]/70 backdrop-blur-xl border border-[#6b7bff]/50 
                shadow-[0_0_40px_rgba(107,123,255,0.4)] text-center select-none"
            >
              <p className="font-sans text-sm sm:text-base font-light text-[#e6e6ff] leading-relaxed">
                {displayThought}
              </p>
            </motion.div>

            {/* Integrated Luminous Star Point (Becomes visible in final phase) */}
            <AnimatePresence>
              {driftPhase === 'starPoint' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2 }}
                  className="absolute z-30 flex items-center justify-center"
                  style={{ right: '22%', bottom: '28%' }}
                >
                  <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#ffffff]" />
                  <div className="absolute w-8 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
                  <div className="absolute w-[1px] h-8 bg-gradient-to-b from-transparent via-white to-transparent pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* 4. Action: Continue to Completion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isReadyToContinue || driftPhase === 'vortex' || driftPhase === 'starPoint' ? 1 : 0.6 }}
          transition={{ duration: 1 }}
          className="mt-6 sm:mt-8"
        >
          <Button
            onClick={onCompleteDrift}
            icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
            aria-label="Continue to Completion stage"
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
};

