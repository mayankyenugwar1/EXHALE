import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ExhaleLogo } from '@/components/features/branding/ExhaleLogo';
import { Button } from '@/components/ui/Button';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface HomeScreenProps {
  onBegin?: () => void;
}

/**
 * EXHALE Home Screen (Exact Reference Match):
 * 
 * Recreates the exact cinematic composition of media_1789223005829.jpg:
 * 1. Top-Left: "A CALMER YOU, / A BRIGHTER TOMORROW." + thin horizontal line
 * 2. Center: Prominent ExhaleLogo -> EXHALE (Space Grotesk tracking-[0.38em]) -> "GIVE YOUR MIND SOME SPACE." -> Begin →
 * 3. Bottom-Right: "IT'S JUST A THOUGHT. / YOU CAN LET IT DRIFT." + thin horizontal line
 * 4. Bottom-Left: Large planetary horizon arc
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ onBegin }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.2,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
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
    <main className="relative flex flex-col items-center justify-center min-h-dvh w-full px-4 sm:px-6 py-8 sm:py-12 pt-safe pb-safe text-center select-none overflow-hidden touch-none overscroll-none">
      {/* Subtle Sound Control */}
      <div className="absolute top-safe right-safe z-30">
        <SoundToggle />
      </div>

      {/* Pure Centered Hero Composition */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center max-w-xl mx-auto my-auto py-4 sm:py-8 z-10 w-full text-center"
      >
        {/* Hero EXHALE Brand Wave Logo */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-9 flex justify-center w-full max-w-[270px] sm:max-w-[350px] md:max-w-[390px]">
          <ExhaleLogo className="w-full" size={105} />
        </motion.div>

        {/* Wordmark & Tagline */}
        <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 mb-9 sm:mb-14 text-center">
          <h1 className="font-sans text-3xl sm:text-5xl md:text-6xl font-extralight sm:font-light tracking-[0.42em] sm:tracking-[0.46em] uppercase text-[#f8faff] drop-shadow-[0_0_16px_rgba(196,181,253,0.22)] pl-[0.42em] sm:pl-[0.46em]">
            EXHALE
          </h1>
          <p className="font-sans text-[11px] sm:text-xs md:text-sm font-light text-[#b4addb]/90 tracking-[0.30em] sm:tracking-[0.34em] uppercase max-w-xs sm:max-w-md mx-auto leading-relaxed pl-[0.30em] sm:pl-[0.34em]">
            Give your mind some space.
          </p>
        </motion.div>

        {/* Begin Action Invitation Button */}
        <motion.div variants={itemVariants}>
          <Button
            onClick={onBegin}
            icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
            aria-label="Begin your experience"
          >
            Begin
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
};

