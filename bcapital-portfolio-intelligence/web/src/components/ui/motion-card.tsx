"use client";
import { MotionConfig, motion, type HTMLMotionProps } from "motion/react";

/**
 * Subtle card entrance (6px rise, once, when scrolled into view — opacity is never animated, so content is visible without JS)
 * and a 2px hover lift. prefers-reduced-motion is honoured by MotionConfig reducedMotion="user" (transforms are skipped), so the
 * server and client always render the SAME element tree — no hydration branch on a media query.
 */
export function MotionCard({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  );
}
