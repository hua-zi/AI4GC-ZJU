"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { motionHeroTransition, motionRevealEnter, motionRevealShow } from "@/lib/motion";

type HomeHeroMotionProps = {
  children: ReactNode;
};

export default function HomeHeroMotion({ children }: HomeHeroMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : motionRevealEnter}
      animate={motionRevealShow}
      transition={motionHeroTransition(reduceMotion)}
    >
      {children}
    </motion.div>
  );
}
