import type { Transition } from "motion/react";

/** Shared easing — smooth deceleration used site-wide */
export const motionEase = [0.16, 1, 0.3, 1] as const;

export const motionDuration = {
  fast: 0.22,
  normal: 0.38,
  layout: 0.42,
  reveal: 0.52,
  hero: 0.62,
} as const;

export function motionStaggerDelay(index: number, reduceMotion: boolean | null): number {
  return reduceMotion ? 0 : index * 0.045;
}

export function motionRevealTransition(
  delay = 0,
  reduceMotion: boolean | null,
): Transition {
  return {
    duration: reduceMotion ? 0 : motionDuration.reveal,
    delay: reduceMotion ? 0 : delay,
    ease: motionEase,
  };
}

export function motionHeroTransition(reduceMotion: boolean | null): Transition {
  return {
    duration: reduceMotion ? 0 : motionDuration.hero,
    ease: motionEase,
  };
}

export function motionLayoutTransition(reduceMotion: boolean | null): Transition {
  return {
    duration: reduceMotion ? 0 : motionDuration.layout,
    ease: motionEase,
  };
}

export function motionListItemTransition(
  index: number,
  reduceMotion: boolean | null,
): Transition {
  return {
    duration: reduceMotion ? 0 : motionDuration.normal,
    delay: motionStaggerDelay(index, reduceMotion),
    ease: motionEase,
    layout: motionLayoutTransition(reduceMotion),
  };
}

export function motionSegmentTransition(reduceMotion: boolean | null): Transition {
  return {
    type: "spring",
    stiffness: reduceMotion ? 1000 : 420,
    damping: reduceMotion ? 100 : 36,
    mass: 0.85,
  };
}

export const motionListEnter = { opacity: 0, y: 14, scale: 0.985 };
export const motionListShow = { opacity: 1, y: 0, scale: 1 };
export const motionListExit = { opacity: 0, y: -8, scale: 0.99 };

export const motionRevealEnter = { opacity: 0, y: 16 };
export const motionRevealShow = { opacity: 1, y: 0 };
