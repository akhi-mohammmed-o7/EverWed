/**
 * EverWed — Luxury Motion Design System
 * Restrained, cinematic, and fluid animation presets tailored for luxury wedding technology.
 */

import type { Variants, Transition } from "motion/react";

// Luxury Easing Curves
export const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Smooth deceleration
export const SILK_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]; // Fluid silk movement
export const SPRING_GENTLE = { type: "spring", stiffness: 120, damping: 20, mass: 0.8 };
export const SPRING_MAGNETIC = { type: "spring", stiffness: 180, damping: 18, mass: 0.6 };

export const defaultTransition: Transition = {
  duration: 0.8,
  ease: LUXURY_EASE,
};

// ── Motion Variant Presets ──────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      delay: custom * 0.1,
      ease: LUXURY_EASE,
    },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    transition: {
      duration: 0.7,
      delay: custom * 0.1,
      ease: SILK_EASE,
    },
  }),
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: (custom: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.85,
      delay: custom * 0.1,
      ease: LUXURY_EASE,
    },
  }),
};

export const slideIn: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  visible: (custom: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      delay: custom * 0.1,
      ease: LUXURY_EASE,
    },
  }),
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: LUXURY_EASE,
    },
  },
};

export const imageReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.06,
    clipPath: "inset(8% 0% 8% 0% round 16px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    clipPath: "inset(0% 0% 0% 0% round 16px)",
    transition: {
      duration: 1.1,
      ease: LUXURY_EASE,
    },
  },
};

