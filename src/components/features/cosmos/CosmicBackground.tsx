import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface CosmicBackgroundProps {
  /**
   * Cosmic expansion factor: 0.0 (home/breathing) to 1.0 (drift pull-back & completion).
   * As expansion increases, deep distant stars smoothly reveal themselves, communicating
   * that the universe around the thought has expanded.
   */
  expansion?: number;
}

interface Star {
  x: number;
  y: number;
  baseX: number; // normalized [0, 1]
  baseY: number; // normalized [0, 1]
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  twinkleAmp: number;
  driftX: number;
  driftY: number;
  tint: 'white' | 'lavender' | 'blue' | 'cyan';
  tier: 'distant' | 'mid' | 'bright' | 'near';
  hasGlow: boolean;
  hasCrossFlare: boolean;
  revealThreshold: number; // 0.0 = base star, > 0.0 = revealed as expansion increases
  depthParallax: number;
}

interface AccentStar {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  size: number;
  delay: number;
}

/**
 * CosmicBackground Component (Pixel Thoughts Inspired Immersive Star Field):
 * 
 * Multi-Layer Depth Architecture:
 * - Layer 1 (Base): Deep navy / near-black space (#050814)
 * - Layer 2 (Nebulae): Ethereal electric blue, lavender, and purple diffuse gradients
 * - Layer 3 (Planet Horizon Arc): Atmospheric celestial limb in lower-left
 * - Layer 4 (Center Contrast Mask): Subtle central dark vignette preserving text legibility
 * - Layer 5 (Celestial Accent Stars): Edge landmark 4-point cross-flare stars
 * - Layer 6 (High-Density Multi-Tier Canvas Starfield):
 *     - ~75% Deep Background Stars (0.35–0.75px, dim, slow twinkle, reveal during drift)
 *     - ~20% Midground Stars (0.85–1.35px, soft white/lavender/blue, gentle motion)
 *     - ~5% Foreground Accents (1.4–2.2px, soft starlight halo, select cross-flares)
 *     - Central readability falloff zone protecting thought and perspective text
 *     - Dynamic drift expansion revealing hundreds of deep cosmos stars
 *     - High-DPI Retina crispness via window.devicePixelRatio
 */
export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ expansion = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Target expansion ref for frame-independent lerping in render loop
  const targetExpansionRef = useRef<number>(expansion);
  useEffect(() => {
    targetExpansionRef.current = Math.max(0, Math.min(1, expansion));
  }, [expansion]);

  // High-performance spring-interpolated mouse parallax motion values (0 React re-renders)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Buttery-smooth, organic spring physics (gentle damping prevents abrupt snapping or jitter)
  const smoothMouseX = useSpring(mouseX, { stiffness: 36, damping: 26, mass: 1 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 36, damping: 26, mass: 1 });

  // Extremely subtle nebula layer transforms (< 0.8px max displacement)
  const nebulaCenterTx = useTransform(smoothMouseX, (v) => (prefersReducedMotion ? 0 : v * 0.15));
  const nebulaCenterTy = useTransform(smoothMouseY, (v) => (prefersReducedMotion ? 0 : v * 0.15));

  const nebulaLeftTx = useTransform(smoothMouseX, (v) => (prefersReducedMotion ? 0 : v * 0.20));
  const nebulaLeftTy = useTransform(smoothMouseY, (v) => (prefersReducedMotion ? 0 : v * 0.20));

  const nebulaRightTx = useTransform(smoothMouseX, (v) => (prefersReducedMotion ? 0 : v * -0.20));
  const nebulaRightTy = useTransform(smoothMouseY, (v) => (prefersReducedMotion ? 0 : v * -0.20));

  const nebulaDustTx = useTransform(smoothMouseX, (v) => (prefersReducedMotion ? 0 : v * -0.15));
  const nebulaDustTy = useTransform(smoothMouseY, (v) => (prefersReducedMotion ? 0 : v * -0.15));

  // Subtle landmark star parallax (< 1.2px max displacement)
  const landmarkTx = useTransform(smoothMouseX, (v) => (prefersReducedMotion ? 0 : v * 0.35));
  const landmarkTy = useTransform(smoothMouseY, (v) => (prefersReducedMotion ? 0 : v * 0.35));

  // Subtle Mouse Parallax Handler (Pointer-fine devices only; zero touch simulation on mobile)
  useEffect(() => {
    if (prefersReducedMotion) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    // Only enable on devices with a fine pointer (mouse / trackpad). Zero touch simulation on mobile!
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const MAX_PARALLAX = 3.5; // Max 3.5px base displacement for near foreground; deep layers move < 0.2px
    let idleTimer: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      // Normalized cursor offset from center [-1, 1]
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / cx));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / cy));

      mouseX.set(nx * MAX_PARALLAX);
      mouseY.set(ny * MAX_PARALLAX);

      // When cursor stops moving for 1.8s: gently glide background back toward natural position (0, 0)
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        mouseX.set(0);
        mouseY.set(0);
      }, 1800);
    };

    const handleMouseLeave = () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      mouseX.set(0);
      mouseY.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('blur', handleMouseLeave, { passive: true });

    return () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleMouseLeave);
    };
  }, [prefersReducedMotion, mouseX, mouseY]);

  // Landmark accent stars positioned along the outer edge nebulae (exact coordinates sampled from reference image)
  const landmarkStars: (AccentStar & { hideOnMobile?: boolean })[] = [
    { x: 82.5, y: 13.5, size: 1.25, delay: 0.6 },
    { x: 15.5, y: 35.5, size: 1.35, delay: 1.5 },
    { x: 11.2, y: 58.0, size: 1.15, delay: 2.4, hideOnMobile: true },
    { x: 82.0, y: 84.0, size: 1.40, delay: 3.2 },
    { x: 29.5, y: 78.5, size: 1.10, delay: 4.2, hideOnMobile: true },
  ];

  // Canvas High-Density Starfield Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let currentExpansion = targetExpansionRef.current;

    const setupCanvasResolution = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setupCanvasResolution();

    // Sparse, cinematic star density matching media_1789747423063.png:
    // Desktop (1920x1080): ~52–62 base stars + ~26–31 revealable during drift
    // Tablet (1024x768):  ~30–40 base stars + ~15–20 revealable
    // Mobile (390x844):   ~26–30 base stars + ~13–15 revealable
    const screenArea = width * height;
    const baseCount = Math.round(Math.min(Math.max(screenArea / 30000, 26), 62));
    const revealableCount = Math.round(baseCount * 0.50);
    const totalCount = baseCount + revealableCount;

    // Organic Deep-Space Dark Voids (preserves natural large areas of empty space)
    const voidCenters = [
      { x: width * 0.35, y: height * 0.30, radius: Math.min(width, height) * 0.22 },
      { x: width * 0.68, y: height * 0.70, radius: Math.min(width, height) * 0.20 },
    ];

    const stars: Star[] = [];

    let crossFlareCount = 0;
    const MAX_CROSS_FLARES = Math.max(2, Math.min(4, Math.floor(width / 350)));

    for (let i = 0; i < totalCount; i++) {
      const isRevealable = i >= baseCount;
      const revealThreshold = isRevealable
        ? 0.15 + Math.random() * 0.70
        : 0;

      // Tier Determination matching prompt & reference image:
      // 75% — tiny, dim distant stars
      // 18% — small visible stars
      // 7%  — slightly brighter stars
      const tierRoll = Math.random();
      let tier: 'distant' | 'mid' | 'bright' | 'near' = 'distant';
      if (tierRoll > 0.93 && !isRevealable) {
        tier = 'bright';
      } else if (tierRoll > 0.75) {
        tier = 'mid';
      } else {
        tier = 'distant';
      }

      // Generate position with full-screen distribution, large empty space preservation,
      // and strict Central Readability Zone + Planet Exclusion protection:
      let starX = 0;
      let starY = 0;
      let attempts = 0;
      const maxAttempts = 25;

      while (attempts < maxAttempts) {
        attempts++;

        starX = Math.random() * width;
        starY = Math.random() * height;

        // Keep within bounds
        starX = Math.max(6, Math.min(width - 6, starX));
        starY = Math.max(6, Math.min(height - 6, starY));

        // 1. Preserve large empty space pockets (deep cosmic voids)
        let inVoid = false;
        for (const v of voidCenters) {
          const vDist = Math.hypot(starX - v.x, starY - v.y);
          if (vDist < v.radius && Math.random() < 0.45) {
            inVoid = true;
            break;
          }
        }
        if (inVoid && attempts < maxAttempts) {
          continue;
        }

        // 2. Planet Exclusion Zone (Bottom-Left celestial sphere)
        const planetBoxPx = Math.max(Math.min(width, height) * 0.42, 240);
        const planetCx = -planetBoxPx * 0.03;
        const planetCy = height + planetBoxPx * 0.03;
        const planetR = planetBoxPx * 0.88;
        if (Math.hypot(starX - planetCx, starY - planetCy) < planetR) {
          if (attempts < maxAttempts) continue;
        }

        // 3. Center Hero Protection Zone (keeps center clear, quiet, and readable)
        const cx = width / 2;
        const cy = height / 2;
        const distFromCenter = Math.hypot(starX - cx, starY - cy);
        const centerClearRadius = Math.min(width, height) * 0.28;
        if (distFromCenter < centerClearRadius) {
          if (Math.random() < 0.85 && attempts < maxAttempts) {
            continue;
          }
        }

        break;
      }

      // Star Attributes based on 3 Tiers (Sparse & Quiet Deep Space):
      let radius = 0.65;
      let baseAlpha = 0.40;
      let twinkleAmp = 0;
      let twinkleSpeed = 0.002;
      let hasGlow = false;
      let hasCrossFlare = false;
      let depthParallax = 0.04;
      let driftFactor = 0.008;

      if (tier === 'distant') {
        // 75% — tiny, dim distant stardust: almost completely stationary (< 0.2px max displacement)
        radius = 0.55 + Math.random() * 0.35; // 0.55px – 0.90px
        baseAlpha = 0.25 + Math.random() * 0.28; // 0.25 – 0.53
        twinkleAmp = Math.random() < 0.35 ? 0.12 : 0.0;
        twinkleSpeed = Math.random() * 0.002 + 0.0012;
        depthParallax = 0.04;
        driftFactor = 0.008;
      } else if (tier === 'mid') {
        // 18% — small visible stars: very subtle movement
        radius = 0.95 + Math.random() * 0.35; // 0.95px – 1.30px
        baseAlpha = 0.55 + Math.random() * 0.22; // 0.55 – 0.77
        twinkleAmp = 0.15 + Math.random() * 0.06;
        twinkleSpeed = Math.random() * 0.0025 + 0.0015;
        depthParallax = 0.18;
        driftFactor = 0.014;
      } else {
        // 7% — slightly brighter stars: crisp starlight depth
        radius = 1.35 + Math.random() * 0.40; // 1.35px – 1.75px
        baseAlpha = 0.80 + Math.random() * 0.18; // 0.80 – 0.98
        twinkleAmp = 0.18 + Math.random() * 0.06;
        twinkleSpeed = Math.random() * 0.003 + 0.002;
        depthParallax = 0.38;
        driftFactor = 0.020;
        hasGlow = true;
        if (crossFlareCount < MAX_CROSS_FLARES && Math.random() < 0.35) {
          hasCrossFlare = true;
          crossFlareCount++;
        }
      }

      // Ethereal Palette matching reference image:
      // 60% soft starlight white, 25% faint lavender, 15% subtle blue
      const colorRoll = Math.random();
      let tint: 'white' | 'lavender' | 'blue' | 'cyan' = 'white';
      if (colorRoll < 0.60) {
        tint = 'white';
      } else if (colorRoll < 0.85) {
        tint = 'lavender';
      } else {
        tint = 'blue';
      }

      stars.push({
        x: starX,
        y: starY,
        baseX: starX / width,
        baseY: starY / height,
        radius,
        baseAlpha,
        twinkleSpeed,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleAmp,
        driftX: (Math.random() - 0.5) * driftFactor,
        driftY: (Math.random() - 0.5) * driftFactor * 0.8,
        tint,
        tier,
        hasGlow,
        hasCrossFlare,
        revealThreshold,
        depthParallax,
      });
    }

    // Main Canvas Render Loop
    const render = () => {
      // Smooth frame-rate independent lerp toward target expansion (~8.5s continuous cosmic reveal)
      const targetExp = targetExpansionRef.current;
      currentExpansion += (targetExp - currentExpansion) * 0.009;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      // Dampen mouse parallax during drift: the cinematic camera takes full control
      const parallaxDampener = Math.max(0, 1 - currentExpansion * 1.5);
      const targetOffsetX = prefersReducedMotion ? 0 : smoothMouseX.get() * parallaxDampener;
      const targetOffsetY = prefersReducedMotion ? 0 : smoothMouseY.get() * parallaxDampener;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // 1. Reveal Multiplier (0.0 on Home screen, smoothly awakens as camera pulls away into deep space)
        let revealProgress = 1.0;
        if (star.revealThreshold > 0) {
          const windowSpan = 0.28;
          const startReveal = star.revealThreshold * 0.75;
          revealProgress = Math.max(0, Math.min(1, (currentExpansion - startReveal) / windowSpan));
          if (revealProgress <= 0.01) {
            continue;
          }
        }

        // 2. Motion & Twinkling
        if (!prefersReducedMotion) {
          star.twinklePhase += star.twinkleSpeed;
          star.x += star.driftX;
          star.y += star.driftY;

          // Wrap boundaries
          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = 0;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;
        }

        // 3. True Cosmic Perspective Camera Pull-Back
        const px = targetOffsetX * star.depthParallax;
        const py = targetOffsetY * star.depthParallax;

        // Camera moves backward: surrounding field-of-view gently opens outward from center
        const pullbackScale = 1 + currentExpansion * 0.065 * (1 - star.depthParallax);
        const renderX = cx + (star.x + px - cx) * pullbackScale;
        const renderY = cy + (star.y + py - cy) * pullbackScale;

        // 4. Alpha Calculation
        const twinkleFactor = prefersReducedMotion
          ? 0
          : Math.sin(star.twinklePhase) * star.twinkleAmp;
        let alpha = star.baseAlpha * (1 + twinkleFactor) * revealProgress;
        alpha = Math.max(0.12, Math.min(0.98, alpha));

        // Color formatting
        let baseR = 245;
        let baseG = 248;
        let baseB = 255;
        if (star.tint === 'lavender') {
          baseR = 216;
          baseG = 180;
          baseB = 254;
        } else if (star.tint === 'blue') {
          baseR = 165;
          baseG = 180;
          baseB = 252;
        } else if (star.tint === 'cyan') {
          baseR = 190;
          baseG = 235;
          baseB = 253;
        }

        // 5. Draw Soft Glow for Accent Stars
        if (star.hasGlow && alpha > 0.3) {
          const glowRadius = star.radius * 3.8;
          const glowGrad = ctx.createRadialGradient(
            renderX,
            renderY,
            star.radius * 0.3,
            renderX,
            renderY,
            glowRadius
          );
          glowGrad.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha * 0.42})`);
          glowGrad.addColorStop(0.5, `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha * 0.14})`);
          glowGrad.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
          ctx.beginPath();
          ctx.arc(renderX, renderY, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // 6. Draw 4-Point Diffraction Spike Cross-Flares for select accent stars
        if (star.hasCrossFlare && alpha > 0.45 && !prefersReducedMotion) {
          const flareLen = star.radius * 6.5;

          // Horizontal flare
          const hGrad = ctx.createLinearGradient(renderX - flareLen, renderY, renderX + flareLen, renderY);
          hGrad.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
          hGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.72})`);
          hGrad.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
          ctx.fillStyle = hGrad;
          ctx.fillRect(renderX - flareLen, renderY - 0.5, flareLen * 2, 1);

          // Vertical flare
          const vGrad = ctx.createLinearGradient(renderX, renderY - flareLen, renderX, renderY + flareLen);
          vGrad.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
          vGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.72})`);
          vGrad.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
          ctx.fillStyle = vGrad;
          ctx.fillRect(renderX - 0.5, renderY - flareLen, 1, flareLen * 2);
        }

        // 7. Draw Star Core Dot (with guaranteed minimum crispness)
        const drawRadius = Math.max(0.68, star.radius);
        ctx.beginPath();
        ctx.arc(renderX, renderY, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha})`;
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      setupCanvasResolution();
      // Remap normalized star positions to new dimensions
      for (const star of stars) {
        star.x = star.baseX * width;
        star.y = star.baseY * height;
      }
      if (prefersReducedMotion) {
        render();
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [prefersReducedMotion, smoothMouseX, smoothMouseY]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030611]"
      aria-hidden="true"
    >
      {/* LAYER 2: Central Diffuse Dark-Violet Atmosphere behind Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[85vw] h-[85vw] max-w-[840px] max-h-[840px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 65% 52% at 50% 42%, rgba(85, 68, 160, 0.28) 0%, rgba(45, 38, 95, 0.15) 45%, rgba(15, 18, 45, 0.04) 70%, transparent 85%)',
            filter: 'blur(35px)',
            x: nebulaCenterTx,
            y: nebulaCenterTy,
          }}
          animate={
            !prefersReducedMotion
              ? {
                  scale: [0.98, 1.03, 0.98],
                  opacity: [0.85, 1.0, 0.85],
                }
              : false
          }
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* LAYER 3A: Upper-Left Deep Blue/Violet Nebula Cloud */}
      <motion.div
        className="absolute -top-[12%] -left-[12%] w-[70vw] h-[70vw] max-w-[800px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 20% 20%, rgba(85, 55, 145, 0.30) 0%, rgba(45, 38, 100, 0.18) 40%, rgba(15, 20, 50, 0.05) 75%, transparent 88%)',
          filter: 'blur(45px)',
          x: nebulaLeftTx,
          y: nebulaLeftTy,
        }}
        animate={
          !prefersReducedMotion
            ? {
                scale: [1, 1.05, 1],
                opacity: [0.8, 1.0, 0.8],
              }
            : false
        }
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* LAYER 3B: Expansive Cosmic Interstellar Nebula along Right / Bottom-Right Edge */}
      <motion.div
        className="absolute top-[15%] -right-[12%] w-[72vw] h-[80vw] max-w-[900px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 65% at 88% 62%, rgba(120, 65, 185, 0.32) 0%, rgba(65, 48, 135, 0.20) 45%, rgba(25, 28, 68, 0.06) 75%, transparent 90%)',
          filter: 'blur(40px)',
          x: nebulaRightTx,
          y: nebulaRightTy,
        }}
        animate={
          !prefersReducedMotion
            ? {
                scale: [1, 1.06, 1],
                opacity: [0.8, 1.0, 0.8],
              }
            : false
        }
        transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* LAYER 3D: Mid-Right Subtle Cosmic Dust */}
      <motion.div
        className="absolute top-[8%] -right-[8%] w-[48vw] h-[48vw] max-w-[580px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 55% at 85% 38%, rgba(60, 75, 160, 0.22) 0%, rgba(35, 40, 95, 0.10) 50%, transparent 80%)',
          filter: 'blur(40px)',
          x: nebulaDustTx,
          y: nebulaDustTy,
        }}
        animate={
          !prefersReducedMotion
            ? {
                scale: [1, 1.04, 1],
                opacity: [0.7, 0.9, 0.7],
              }
            : false
        }
        transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />

      {/* 4. Canvas Background Starfield */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block opacity-95 pointer-events-none" />

      {/* LAYER 3C: Bottom-Left Celestial Planet Horizon (Solid Dark Sphere with Atmospheric Crescent Limb) */}
      <div
        className="absolute bottom-0 left-0 w-[42vmin] h-[42vmin] min-w-[240px] min-h-[240px] max-w-[480px] max-h-[480px] pointer-events-none z-10 overflow-visible"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full overflow-visible"
          fill="none"
        >
          <defs>
            {/* Planet Body Radial Gradient: darkest navy-black */}
            <radialGradient id="planetBodyGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#08142a" />
              <stop offset="50%" stopColor="#040a18" />
              <stop offset="85%" stopColor="#020610" />
              <stop offset="100%" stopColor="#010308" />
            </radialGradient>

            {/* Atmospheric Crescent Limb Gradient */}
            <linearGradient id="planetLimbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#c7d2fe" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#818cf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.3" />
            </linearGradient>

            {/* Atmospheric Corona Glow Filter */}
            <filter id="planetAtmosphereGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur1" />
              <feGaussianBlur stdDeviation="16" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="planetHazeDeep" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>

          {/* Planet Body (solid dark sphere occluding background stars) */}
          <circle cx="-15" cy="515" r="445" fill="url(#planetBodyGrad)" />

          {/* Soft Atmospheric Haze / Outer Corona */}
          <circle
            cx="-15"
            cy="515"
            r="445"
            stroke="#6366f1"
            strokeWidth="24"
            opacity="0.22"
            filter="url(#planetHazeDeep)"
          />
          <circle
            cx="-15"
            cy="515"
            r="445"
            stroke="#818cf8"
            strokeWidth="12"
            opacity="0.38"
            filter="url(#planetAtmosphereGlow)"
          />

          {/* Crisp Starlight Atmospheric Crescent Limb */}
          <circle
            cx="-15"
            cy="515"
            r="445"
            stroke="url(#planetLimbGrad)"
            strokeWidth="2.2"
            opacity="0.92"
          />
        </svg>
      </div>

      {/* 5. Landmark Celestial 4-Point Accent Stars along Outer Nebulae */}
      {landmarkStars.map((star, idx) => (
        <motion.div
          key={idx}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 ${
            star.hideOnMobile ? 'hidden sm:block' : ''
          }`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            x: landmarkTx,
            y: landmarkTy,
          }}
          animate={
            !prefersReducedMotion
              ? {
                  opacity: [0.75, 1, 0.75],
                  scale: [0.94, 1.12, 0.94],
                }
              : false
          }
          transition={{
            duration: 4.8 + idx * 0.7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: star.delay,
          }}
        >
          {/* Core Starlight Point */}
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          {/* Atmospheric Halo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-400/25 blur-sm" />
          {/* 4-Point Cross Flare Diffraction Rays */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-9 bg-gradient-to-b from-transparent via-white/90 to-transparent" />
        </motion.div>
      ))}
    </div>
  );
};

