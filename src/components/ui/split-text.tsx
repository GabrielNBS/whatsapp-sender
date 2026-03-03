'use client';

import { motion, type Variants, type Transition } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

type SplitMode = 'chars' | 'words';

interface SplitTextProps {
  /** The text to animate */
  text: string;
  /** Split by characters or words */
  mode?: SplitMode;
  /** HTML tag to render as the wrapper */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  /** Additional className for the wrapper element */
  className?: string;
  /** Additional className applied to each animated segment */
  segmentClassName?: string;
  /** Stagger delay between each segment (seconds) */
  stagger?: number;
  /** Initial delay before animation starts (seconds) */
  delay?: number;
  /** Animation duration per segment (seconds) */
  duration?: number;
  /** Custom variants — overrides the default fade-up animation */
  variants?: Variants;
  /** Custom transition overrides */
  transition?: Transition;
  /** Whether to animate on every mount or only once (via whileInView) */
  once?: boolean;
}

const defaultVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
};

export function SplitText({
  text,
  mode = 'chars',
  className,
  segmentClassName,
  stagger = 0.03,
  delay = 0,
  duration = 0.35,
  variants = defaultVariants,
  once = true,
}: SplitTextProps) {
  const segments = useMemo(() => {
    if (mode === 'words') {
      return text.split(/(\s+)/);
    }
    // chars mode — split by character, preserve spaces
    return text.split('');
  }, [text, mode]);

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const child: Variants = {
    hidden: variants.hidden,
    visible: {
      ...variants.visible,
      transition: {
        duration,
        ease: [0.25, 0.4, 0, 1],
      },
    },
  };

  return (
    <motion.div
      className={cn('inline-flex flex-wrap', className)}
      variants={container}
      initial="hidden"
      animate="visible"
      {...(once ? {} : { whileInView: 'visible', viewport: { once: true } })}
      role="heading"
      aria-label={text}
    >
      {segments.map((segment, i) => {
        // Preserve whitespace as non-animated spaces
        if (/^\s+$/.test(segment)) {
          return (
            <span key={`space-${i}`} className="whitespace-pre">
              {segment}
            </span>
          );
        }

        if (mode === 'words') {
          return (
            <motion.span
              key={`word-${i}`}
              variants={child}
              className={cn('inline-block', segmentClassName)}
            >
              {segment}
            </motion.span>
          );
        }

        // chars mode
        return (
          <motion.span
            key={`char-${i}`}
            variants={child}
            className={cn('inline-block', segmentClassName)}
          >
            {segment}
          </motion.span>
        );
      })}
    </motion.div>
  );
}
