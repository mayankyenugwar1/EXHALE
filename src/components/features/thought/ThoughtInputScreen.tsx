import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface ThoughtInputScreenProps {
  onBack: () => void;
  onContinue: (thought: string) => void;
  initialThought?: string;
}

const MAX_CHARACTERS = 500;

/**
 * EXHALE Thought Input Screen Component (Phase 02):
 * 
 * Intimate, quiet, and spacious thought entry screen matching the approved branding reference:
 * - Upper-left back button (←) & upper-right session timer (2:00)
 * - Heading: "What's on / your mind?"
 * - Tagline: "Write it down. Let it out."
 * - Translucent deep navy textarea with 500 character limit and dynamic counter
 * - Continue button (disabled when empty)
 */
export const ThoughtInputScreen: React.FC<ThoughtInputScreenProps> = ({
  onBack,
  onContinue,
  initialThought = '',
}) => {
  const [thought, setThought] = useState<string>(initialThought);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARACTERS) {
      setThought(value);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (thought.trim()) {
      onContinue(thought.trim());
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.2,
        delayChildren: prefersReducedMotion ? 0 : 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <main className="relative flex flex-col justify-between min-h-dvh w-full px-4 sm:px-6 pt-safe pb-safe select-none overflow-y-auto overscroll-y-contain">
      {/* 1. Header Navigation: Back Arrow & Timer Indicator */}
      <header className="w-full flex justify-between items-center max-w-xl mx-auto z-10 pt-1 sm:pt-2">
        <button
          onClick={onBack}
          className="group inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 -ml-2 text-slate-400 hover:text-white 
            transition-all duration-300 rounded-full active:scale-[0.93] touch-manipulation focus-visible:outline-none focus-visible:ring-1 
            focus-visible:ring-[#a78bfa]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050814]"
          aria-label="Return to Home screen"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-3">
          <SoundToggle />
          <div
            className="font-mono text-xs tracking-widest text-[#a78bfa]/75 font-light"
            aria-label="Session duration timer indicator"
          >
            0:30
          </div>
        </div>
      </header>

      {/* 2. Main Centered Thought Form */}
      <motion.form
        onSubmit={handleFormSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center max-w-xl mx-auto my-auto py-4 sm:py-6 z-10 w-full"
      >
        {/* Main Heading */}
        <motion.div variants={itemVariants} className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10">
          <h1 className="font-sans text-xl sm:text-3xl md:text-4xl font-light text-[#e6e6ff] tracking-wide leading-tight drop-shadow-[0_0_16px_rgba(167,139,250,0.25)]">
            What’s on<br />your mind?
          </h1>
          <p className="font-sans text-xs sm:text-sm font-light text-[#a78bfa]/75 tracking-wider">
            Write it down. Let it out.
          </p>
        </motion.div>

        {/* Translucent Textarea Input Card */}
        <motion.div variants={itemVariants} className="w-full mb-6 sm:mb-10">
          <div
            className="relative w-full bg-[#0b1b3d]/40 backdrop-blur-md border border-[#6b7bff]/25 
              focus-within:border-[#a78bfa]/50 focus-within:shadow-[0_0_25px_rgba(167,139,250,0.18)] 
              transition-all duration-500 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(11,27,61,0.5)]"
          >
            <textarea
              value={thought}
              onChange={handleTextChange}
              placeholder="Type your thought here..."
              rows={4}
              maxLength={MAX_CHARACTERS}
              aria-label="Type your thought here"
              className="w-full bg-transparent text-[#e6e6ff] placeholder:text-slate-500/70 font-sans text-base 
                font-light leading-relaxed resize-none border-none outline-none focus:outline-none focus:ring-0 select-text
                min-h-[100px] sm:min-h-[130px] max-h-[30vh] sm:max-h-[40vh] overflow-y-auto"
              autoFocus
            />

            {/* Character Counter */}
            <div className="flex justify-end pt-2">
              <span className="font-mono text-[11px] text-slate-400/60 tracking-wider">
                {thought.length}/{MAX_CHARACTERS}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Continue Action Button */}
        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            disabled={!thought.trim()}
            icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
            aria-label="Continue to next step"
          >
            Continue
          </Button>
        </motion.div>
      </motion.form>
    </main>
  );
};
