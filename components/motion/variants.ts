import type { Transition, Variants } from 'framer-motion'

export const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const smoothTransition: Transition = {
  duration: 0.42,
  ease: smoothEase,
}

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.24,
      ease: smoothEase,
    },
  },
}

export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
      ease: smoothEase,
    },
  },
}

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.992,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: smoothTransition,
  },
}
