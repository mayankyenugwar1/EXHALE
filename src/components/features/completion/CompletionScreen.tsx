import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface CompletionScreenProps {
  onBack: () => void;
  onReturnHome: () => void;
}

/**
 * EXHALE Completion Screen Component (Screen 5):
 * 
 * The quiet emotional resolution of EXHALE:
 * Perspective, distance, and peaceful release.
 * 
 * Visual hierarchy:
 * 1. Back arrow (←) & session timer (0:00)
 * 2. Heading: "A little more space."
 * 3. Subtitle: "The thought is still a part of you, / but now you see it differently."
 * 4. Brilliant perspective star & tilted spiral galaxy disc
 * 5. Translucent glass message card: "It's just a thought. / And you handled it well."
 * 6. Action button: "Return Home"
 */
export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  onBack,
  onReturnHome,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

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
      {/* 1. Header Navigation: Back Arrow & Timer (0:00) */}
      <header className="w-full flex justify-between items-center max-w-xl mx-auto z-10 pt-2">
        <button
          onClick={onBack}
          className="group inline-flex items-center justify-center p-2.5 -ml-2 text-slate-400 hover:text-white 
            transition-colors duration-300 rounded-full focus-visible:outline-none focus-visible:ring-1 
            focus-visible:ring-[#a78bfa]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]"
          aria-label="Return to Drifting screen"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
        </button>

        <div
          className="font-mono text-xs tracking-widest text-[#a78bfa]/75 font-light"
          aria-label="Session duration complete"
        >
          0:00
        </div>
      </header>

      {/* 2. Main Centered Perspective Composition */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center max-w-xl mx-auto my-auto py-4 z-10 w-full"
      >
        {/* Heading & Subtitle */}
        <motion.div variants={itemVariants} className="text-center space-y-2 mb-6 sm:mb-8">
          <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-light text-[#e6e6ff] tracking-wide leading-tight drop-shadow-[0_0_16px_rgba(167,139,250,0.25)]">
            A little more space.
          </h1>
          <p className="font-sans text-xs sm:text-sm font-light text-[#a78bfa]/75 tracking-wider leading-relaxed">
            The thought is still a part of you,<br />but now you see it differently.
          </p>
        </motion.div>

        {/* 3. Brilliant Perspective Star & Tilted Spiral Galaxy Disc */}
        <motion.div
          variants={itemVariants}
          className="relative w-64 h-52 sm:w-80 sm:h-64 flex flex-col items-center justify-center my-2"
        >
          {/* Luminous 4-Point Perspective Star */}
          <motion.div
            animate={
              !prefersReducedMotion
                ? {
                    scale: [1, 1.15, 1],
                    opacity: [0.85, 1, 0.85],
                  }
                : false
            }
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex items-center justify-center mb-6"
          >
            {/* Core Star Point */}
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_14px_#ffffff]" />
            {/* Soft Ambient Halo */}
            <div className="absolute w-12 h-12 rounded-full bg-[#a78bfa]/30 blur-md pointer-events-none" />
            {/* 4-point Cross Flare Rays */}
            <div className="absolute w-14 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
            <div className="absolute w-[1.5px] h-14 bg-gradient-to-b from-transparent via-white to-transparent pointer-events-none" />
          </motion.div>

          {/* Tilted Spiral Galaxy Disc */}
          <div className="relative w-48 h-20 sm:w-60 sm:h-24 pointer-events-none opacity-70">
            <svg
              viewBox="0 0 200 80"
              className="w-full h-full overflow-visible"
              style={{ transform: 'rotate(-15deg)' }}
            >
              <defs>
                <radialGradient id="galaxyCenterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#6b7bff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0b1b3d" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="galaxyArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#6b7bff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0b1b3d" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Core Elliptical Glow */}
              <ellipse cx="100" cy="40" rx="30" ry="12" fill="url(#galaxyCenterGlow)" />

              {/* Outer Spiral Rings */}
              <motion.ellipse
                cx="100"
                cy="40"
                rx="65"
                ry="22"
                stroke="url(#galaxyArmGrad)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="4 8"
                animate={!prefersReducedMotion ? { rotate: 360 } : false}
                transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '100px 40px' }}
              />

              <motion.ellipse
                cx="100"
                cy="40"
                rx="85"
                ry="28"
                stroke="url(#galaxyArmGrad)"
                strokeWidth="1.2"
                fill="none"
                strokeDasharray="6 12"
                opacity="0.5"
                animate={!prefersReducedMotion ? { rotate: -360 } : false}
                transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '100px 40px' }}
              />
            </svg>
          </div>
        </motion.div>

        {/* 4. Glass Message Card */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-sm sm:max-w-md mx-auto mb-8 sm:mb-10 px-6 py-5 rounded-2xl 
            bg-[#0b1b3d]/45 backdrop-blur-xl border border-[#6b7bff]/25 
            shadow-[0_0_30px_rgba(11,27,61,0.5)] text-center"
        >
          <p className="font-sans text-sm sm:text-base font-light text-[#e6e6ff]/95 leading-relaxed">
            It's just a thought.<br />And you handled it well.
          </p>
        </motion.div>

        {/* 5. Primary Action: Return Home */}
        <motion.div variants={itemVariants}>
          <Button
            onClick={onReturnHome}
            icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
            aria-label="Return to Home screen"
          >
            Return Home
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
};
