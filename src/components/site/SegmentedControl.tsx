"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { motionSegmentTransition } from "@/lib/motion";

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const reduceMotion = useReducedMotion();
  const indicatorId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusSegment = useCallback((index: number) => {
    refs.current[index]?.focus();
  }, []);

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = (index + 1) % options.length;
      onChange(options[next].value);
      focusSegment(next);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const prev = (index - 1 + options.length) % options.length;
      onChange(options[prev].value);
      focusSegment(prev);
    }
  }

  return (
    <div
      className={cn("segmented-control", className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={cn(
              "segmented-control__segment",
              isSelected && "segmented-control__segment--active",
            )}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {isSelected ? (
              <motion.span
                layoutId={indicatorId}
                className="segmented-control__indicator"
                transition={motionSegmentTransition(reduceMotion)}
                aria-hidden="true"
              />
            ) : null}
            <span className="segmented-control__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
