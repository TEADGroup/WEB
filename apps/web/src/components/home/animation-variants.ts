'use client';

export const easings = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.87, 0, 0.13, 1] as const,
};

export const durations = {
  fast: 0.25,
  normal: 0.45,
  slow: 0.65,
  reveal: 1.0,
};

export const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.out },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: durations.normal, ease: easings.out },
  },
};
