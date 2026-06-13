"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { motionRevealEnter, motionRevealShow, motionRevealTransition } from "@/lib/motion";

type HomeRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function HomeReveal({ children, className, delay = 0 }: HomeRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : motionRevealEnter}
      whileInView={motionRevealShow}
      viewport={{ once: true, amount: 0.12 }}
      transition={motionRevealTransition(delay, reduceMotion)}
    >
      {children}
    </motion.div>
  );
}
