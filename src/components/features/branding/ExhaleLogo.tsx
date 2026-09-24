import React from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface ExhaleLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
  variant?: 'default' | 'compact' | 'monochrome';
}

/**
 * EXHALE Official Brand Identity Logo (Exact Reference Match):
 * 
 * Recreates the exact S-wave ribbon logo from the approved artwork:
 * - Single continuous organic S-wave ribbon dipping on the left and swelling into a crest on the right
 * - Secondary parallel under-glow ribbon providing 3D depth
 * - 4 distinct 4-point celestial stars dispersing from the right wave tip
 * - Gradient flow: #0B1B3D -> #6B7BFF -> #A78BFA -> #E6E6FF
 */
export const ExhaleLogo: React.FC<ExhaleLogoProps> = ({
  className = '',
  size,
  animate = true,
  variant = 'default',
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;
  const isMonochrome = variant === 'monochrome';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      aria-label="EXHALE logo"
      role="img"
    >
      {/* Soft Luminous Atmospheric Aura Backing — gently breathes as a small cosmic phenomenon */}
      {!isMonochrome && (
        <motion.div
          className="absolute inset-0 max-w-[110%] -left-[5%] h-[80%] my-auto rounded-full blur-2xl pointer-events-none -z-10 mix-blend-screen"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.38) 0%, rgba(107, 123, 255, 0.22) 40%, rgba(76, 29, 149, 0.05) 70%, transparent 85%)',
          }}
          animate={
            shouldAnimate
              ? {
                  opacity: [0.35, 0.58, 0.35],
                  scale: [0.96, 1.04, 0.96],
                }
              : { opacity: 0.45 }
          }
          transition={{
            duration: 8.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <svg
        viewBox="0 0 360 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible max-w-[300px] sm:max-w-[360px] md:max-w-[420px]"
        style={size ? { height: size } : undefined}
      >
        <defs>
          {/* Main S-Wave Ribbon Gradient (#0B1B3D -> #6B7BFF -> #A78BFA -> #E6E6FF) */}
          <linearGradient id="exhaleRibbonGradPrimary" x1="20" y1="70" x2="285" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isMonochrome ? '#ffffff' : '#3b82f6'} stopOpacity="0.2" />
            <stop offset="25%" stopColor={isMonochrome ? '#ffffff' : '#6b7bff'} stopOpacity="0.8" />
            <stop offset="60%" stopColor={isMonochrome ? '#ffffff' : '#a78bfa'} stopOpacity="1" />
            <stop offset="88%" stopColor={isMonochrome ? '#ffffff' : '#e6e6ff'} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isMonochrome ? '#ffffff' : '#a78bfa'} stopOpacity="0.4" />
          </linearGradient>

          {/* Secondary Under-Ribbon Gradient */}
          <linearGradient id="exhaleRibbonGradSecondary" x1="35" y1="76" x2="278" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isMonochrome ? '#ffffff' : '#0b1b3d'} stopOpacity="0.1" />
            <stop offset="35%" stopColor={isMonochrome ? '#ffffff' : '#6b7bff'} stopOpacity="0.65" />
            <stop offset="80%" stopColor={isMonochrome ? '#ffffff' : '#a78bfa'} stopOpacity="0.85" />
            <stop offset="100%" stopColor={isMonochrome ? '#ffffff' : '#6b7bff'} stopOpacity="0.25" />
          </linearGradient>

          {/* Soft Luminous Drop Shadow Filter */}
          <filter id="exhaleRibbonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="glowBlur" />
            <feMerge>
              <feMergeNode in="glowBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial Flare for Dispersing Stars */}
          <radialGradient id="starFlareRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="45%" stopColor={isMonochrome ? '#ffffff' : '#a78bfa'} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isMonochrome ? '#ffffff' : '#6b7bff'} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Glow Backing Lines */}
        {!isMonochrome && (
          <g filter="url(#exhaleRibbonGlow)" opacity="0.65">
            <path
              d="M 25 70 C 65 70, 95 88, 145 66 C 195 44, 235 18, 285 28"
              stroke="url(#exhaleRibbonGradPrimary)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 40 76 C 78 78, 105 92, 150 72 C 190 56, 228 32, 278 36"
              stroke="url(#exhaleRibbonGradSecondary)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 1. Main Continuous Organic S-Wave Ribbon */}
        <motion.path
          d="M 25 70 C 65 70, 95 88, 145 66 C 195 44, 235 18, 285 28"
          stroke="url(#exhaleRibbonGradPrimary)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={shouldAnimate ? { pathLength: 0.92, opacity: 0.85 } : false}
          animate={
            shouldAnimate
              ? {
                  pathLength: [0.94, 1, 0.94],
                  opacity: [0.85, 1, 0.85],
                }
              : false
          }
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* 2. Secondary Parallel Under-Glow Ribbon */}
        <motion.path
          d="M 40 76 C 78 78, 105 92, 150 72 C 190 56, 228 32, 278 36"
          stroke="url(#exhaleRibbonGradSecondary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={shouldAnimate ? { pathLength: 0.9, opacity: 0.7 } : false}
          animate={
            shouldAnimate
              ? {
                  pathLength: [0.9, 0.98, 0.9],
                  opacity: [0.7, 0.92, 0.7],
                }
              : false
          }
          transition={{
            duration: 7.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.4,
          }}
        />

        {/* 3. Dispersing 4-Point Celestial Stars */}
        {/* Star 1: Primary upper right 4-point star */}
        <motion.g
          animate={
            shouldAnimate
              ? {
                  opacity: [0.8, 1, 0.8],
                  scale: [0.95, 1.15, 0.95],
                }
              : false
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
          style={{ transformOrigin: '304px 20px' }}
        >
          <circle cx="304" cy="20" r="2.4" fill="#ffffff" />
          <circle cx="304" cy="20" r="7" fill="url(#starFlareRadial)" opacity="0.9" />
          {/* 4-point diffraction cross flare */}
          <path d="M 304 12 L 304 28 M 296 20 L 312 20" stroke="#ffffff" strokeWidth="0.75" opacity="0.75" />
        </motion.g>

        {/* Star 2: Medium upper outer star */}
        <motion.g
          animate={
            shouldAnimate
              ? {
                  opacity: [0.55, 0.95, 0.55],
                  scale: [0.88, 1.18, 0.88],
                }
              : false
          }
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
          style={{ transformOrigin: '324px 30px' }}
        >
          <circle cx="324" cy="30" r="1.8" fill={isMonochrome ? '#ffffff' : '#a78bfa'} />
          <circle cx="324" cy="30" r="5" fill="url(#starFlareRadial)" opacity="0.75" />
          <path d="M 324 24 L 324 36 M 318 30 L 330 30" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
        </motion.g>

        {/* Star 3: Lower stardust star */}
        <motion.g
          animate={
            shouldAnimate
              ? {
                  opacity: [0.45, 0.9, 0.45],
                  scale: [0.9, 1.12, 0.9],
                }
              : false
          }
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }}
          style={{ transformOrigin: '308px 42px' }}
        >
          <circle cx="308" cy="42" r="1.4" fill={isMonochrome ? '#ffffff' : '#6b7bff'} />
          <circle cx="308" cy="42" r="4" fill="url(#starFlareRadial)" opacity="0.6" />
          <path d="M 308 37 L 308 47 M 303 42 L 313 42" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
        </motion.g>

        {/* Star 4: Far tip micro star */}
        <motion.g
          animate={
            shouldAnimate
              ? {
                  opacity: [0.35, 0.8, 0.35],
                }
              : false
          }
          transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut', delay: 3.1 }}
          style={{ transformOrigin: '334px 48px' }}
        >
          <circle cx="334" cy="48" r="1.0" fill={isMonochrome ? '#ffffff' : '#e6e6ff'} />
          <circle cx="334" cy="48" r="3" fill="url(#starFlareRadial)" opacity="0.45" />
        </motion.g>

        {/* Star 5: Inner sparkle */}
        <motion.g
          animate={
            shouldAnimate
              ? {
                  opacity: [0.25, 0.7, 0.25],
                }
              : false
          }
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
          style={{ transformOrigin: '292px 50px' }}
        >
          <circle cx="292" cy="50" r="0.8" fill="#ffffff" />
        </motion.g>
      </svg>
    </div>
  );
};
