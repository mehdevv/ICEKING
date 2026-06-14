import type { Transition, Variants } from "framer-motion";

export const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const pageTransition: Transition = reducedMotion
  ? { duration: 0 }
  : { duration: 0.2, ease: "easeInOut" };

export const pageVariants: Variants = {
  initial: { opacity: reducedMotion ? 1 : 0 },
  animate: { opacity: 1 },
  exit: { opacity: reducedMotion ? 1 : 0 },
};

export const fadeUp: Variants = {
  initial: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export const scaleIn: Variants = {
  initial: { opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 24 },
  },
};

export const scanResultSpring: Transition = reducedMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 280, damping: 22, duration: 0.4 };

export const scanResultVariants: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: scanResultSpring,
  },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: reducedMotion ? 0 : 0.06,
    },
  },
};

export function vibrate(pattern: number | number[] = 50) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
