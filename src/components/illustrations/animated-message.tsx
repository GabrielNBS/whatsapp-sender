'use client';

import { motion } from 'framer-motion';

export function AnimatedMessage({ className }: { className?: string }) {
  return (
    <motion.svg viewBox="0 0 100 100" className={className} initial="initial" animate="animate">
      <motion.path
        d="M30 35 H70 C75 35 80 40 80 45 V65 C80 70 75 75 70 75 H45 L32 85 V75 C27 75 22 70 22 65 V45 C22 40 27 35 30 35Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-primary"
        variants={{ animate: { y: [0, -3, 0] } }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />
      <motion.path d="M38 50 H62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/40" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
      <motion.path d="M38 60 H54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/40" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
      {Array.from({ length: 3 }, (_, index) => (
        <motion.circle
          key={index}
          cx="50"
          cy="55"
          r="2"
          className="text-success/60"
          fill="currentColor"
          variants={{
            initial: { x: 0, y: 0, opacity: 0, scale: 0 },
            animate: {
              x: [0, 35 + index * 5],
              y: [0, -25 + index * 15],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
            },
          }}
          transition={{ repeat: Infinity, duration: 3, delay: index, ease: 'easeOut' }}
        />
      ))}
      <motion.path
        d="M82 40 C88 45 88 65 82 70"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-primary"
        animate={{ opacity: [0, 1, 0], x: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
    </motion.svg>
  );
}
