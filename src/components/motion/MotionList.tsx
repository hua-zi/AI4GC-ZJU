"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  motionListEnter,
  motionListExit,
  motionListItemTransition,
  motionListShow,
} from "@/lib/motion";

type MotionListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  className?: string;
  itemClassName?: string;
};

export default function MotionList<T>({
  items,
  getKey,
  renderItem,
  className,
  itemClassName,
}: MotionListProps<T>) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item, index) => (
          <motion.div
            key={getKey(item)}
            layout
            className={cn("motion-list__item", itemClassName)}
            initial={reduceMotion ? false : motionListEnter}
            animate={motionListShow}
            exit={reduceMotion ? undefined : { ...motionListExit, transition: { duration: 0.22 } }}
            transition={motionListItemTransition(index, reduceMotion)}
          >
            {renderItem(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
