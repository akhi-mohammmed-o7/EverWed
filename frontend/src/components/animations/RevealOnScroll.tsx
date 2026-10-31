import React from "react";
import { motion, type Variants } from "motion/react";
import {
  fadeUp,
  fadeIn,
  scaleIn,
  slideIn,
  imageReveal,
  staggerContainer as defaultStaggerContainer,
  staggerItem as defaultStaggerItem,
  LUXURY_EASE,
} from "../../lib/motion";

export type RevealVariant = "fadeUp" | "fadeIn" | "scaleIn" | "slideIn" | "imageReveal";

interface RevealOnScrollProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number | "some" | "all";
  custom?: number;
}

const variantMap: Record<RevealVariant, Variants> = {
  fadeUp,
  fadeIn,
  scaleIn,
  slideIn,
  imageReveal,
};

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  variant = "fadeUp",
  delay = 0,
  duration,
  className = "",
  once = true,
  amount = 0.2,
  custom = 0,
}) => {
  const selectedVariant = variantMap[variant] || fadeUp;

  // Custom transition overrides if duration/delay specified explicitly
  const customTransition = (duration || delay) ? {
    transition: {
      duration: duration || 0.85,
      delay,
      ease: LUXURY_EASE,
    },
  } : undefined;

  return (
    <motion.div
      variants={selectedVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      custom={custom}
      className={className}
      {...(customTransition ? { transition: customTransition.transition } : {})}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
  once?: boolean;
  amount?: number | "some" | "all";
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = "",
  delayChildren = 0.15,
  staggerChildren = 0.1,
  once = true,
  amount = 0.2,
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = "",
}) => {
  return (
    <motion.div
      variants={defaultStaggerItem}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default RevealOnScroll;

