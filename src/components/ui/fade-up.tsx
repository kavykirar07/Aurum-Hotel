"use client";
// src/components/ui/fade-up.tsx
// Reusable scroll-triggered entrance animation using Framer Motion.
// Uses whileInView so the element animates each time it enters the viewport (once=true).

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
  /** Stagger delay in seconds */
  delay?: number;
  /** Custom y-offset in px (default 28) */
  yOffset?: number;
  /** Additional Tailwind / CSS classes on the wrapper */
  className?: string;
  /** Trigger distance from viewport edge before animating (default "-60px") */
  margin?: string;
}

export function FadeUp({
  children,
  delay = 0,
  yOffset = 28,
  className,
  margin = "-60px",
}: FadeUpProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: yOffset }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.72,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — wraps children so they animate in sequence.
 * Use with FadeUp children that have incrementing delay props.
 *
 * @example
 * <StaggerContainer>
 *   {items.map((item, i) => (
 *     <FadeUp key={item.id} delay={i * 0.08}>{item.name}</FadeUp>
 *   ))}
 * </StaggerContainer>
 */
export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
