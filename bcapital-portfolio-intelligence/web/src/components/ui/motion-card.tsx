"use client";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

/**
 * Subtle card entrance (6px rise, once, when scrolled into view — opacity is never animated, so content is visible without JS)
 * and a 2px hover lift. Client-only; honours prefers-reduced-motion (renders static).
 */
export function MotionCard({ children, className, ...rest }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  if (reduce) return <motion.div className={className} {...rest}>{children}</motion.div>;
  return (
    <motion.div
      className={className}
      initial={{ y: 6 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
