'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Spring presets for common use cases.
 * Use these with the `spring` prop on AnimatedContent.
 */
export const springPresets = {
  /** Snappy, responsive feel (default) */
  snappy: { type: 'spring' as const, stiffness: 300, damping: 28, mass: 0.8 },
  /** Gentle, smooth transitions */
  gentle: { type: 'spring' as const, stiffness: 180, damping: 22, mass: 1 },
  /** Bouncy, playful feel */
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 18, mass: 0.6 },
  /** Very fast, minimal overshoot */
  stiff:  { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.5 },
};

export type SpringPreset = keyof typeof springPresets;

interface AnimatedContentProps {
  /** Unique key to trigger the transition (e.g. step number, tab value) */
  activeKey: string | number;
  /** Content to render */
  children: React.ReactNode;
  /** Spring preset name */
  spring?: SpringPreset;
  /** Direction of the slide: 'horizontal' or 'vertical' */
  direction?: 'horizontal' | 'vertical';
  /** Slide offset in pixels */
  offset?: number;
  /** Enable exit animation */
  exitAnimation?: boolean;
  /** Additional className for the motion wrapper */
  className?: string;
  /** AnimatePresence mode */
  mode?: 'wait' | 'sync' | 'popLayout';
}

/**
 * Reusable animated content switcher with spring physics.
 *
 * @example
 * // Wizard steps
 * <AnimatedContent activeKey={currentStep} spring="snappy">
 *   {currentStep === 1 && <Step1 />}
 * </AnimatedContent>
 *
 * @example
 * // Tab content
 * <AnimatedContent activeKey={activeTab} spring="gentle" direction="vertical">
 *   <TabPanel />
 * </AnimatedContent>
 */
export function AnimatedContent({
  activeKey,
  children,
  spring = 'snappy',
  direction = 'horizontal',
  offset = 24,
  exitAnimation = true,
  className,
  mode = 'wait',
}: AnimatedContentProps) {
  const springConfig = springPresets[spring];

  const isHorizontal = direction === 'horizontal';

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={activeKey}
        initial={{
          opacity: 0,
          x: isHorizontal ? offset : 0,
          y: isHorizontal ? 0 : offset,
          filter: 'blur(2px)',
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          transition: springConfig,
        }}
        exit={
          exitAnimation
            ? {
                opacity: 0,
                x: isHorizontal ? -offset : 0,
                y: isHorizontal ? 0 : -offset,
                filter: 'blur(2px)',
                transition: { duration: 0.15 },
              }
            : undefined
        }
        className={cn('w-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
