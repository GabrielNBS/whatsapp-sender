'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  animateIntro?: boolean;
  subtleWhenIdle?: boolean;
};

const wordmarkPaths = [
  'M0 0h2.39c1.6 0 2.68.08 3.24.23s1.03.54 1.38 1.16.53 1.62.53 2.98c0 1.25-.13 2.08-.38 2.51s-.75.69-1.49.77c.67.2 1.12.48 1.35.82s.37.66.43.94.08 1.08.08 2.37V16H4.39v-5.32c0-.86-.05-1.39-.16-1.59s-.4-.31-.86-.31V16H0V0Zm3.38 2.74V6.3c.38 0 .65-.06.8-.19s.23-.55.23-1.25v-.88c0-.51-.07-.84-.22-1s-.42-.24-.81-.24Z',
  'M9.2 0h5.64v3.2h-2.26v3.03h2.11v3.04h-2.11v3.52h2.48V16H9.2V0Z',
  'M24.28 5.98H20.9V4.59c0-.88-.03-1.43-.1-1.65s-.22-.33-.46-.33c-.21 0-.35.09-.43.28s-.11.68-.11 1.46v7.37c0 .69.04 1.14.11 1.36s.22.33.45.33c.25 0 .41-.12.5-.37s.13-.73.13-1.44V9.78h-.68V7.45h3.96v8.24h-2.13l-.31-1.1c-.23.47-.52.83-.87 1.07-.35.24-.77.36-1.24.36-.57 0-1.1-.16-1.6-.49-.5-.33-.87-.73-1.13-1.21-.26-.48-.42-.98-.48-1.51s-.1-1.32-.1-2.38V5.87c0-1.47.07-2.53.2-3.2s.52-1.27 1.15-1.83S19.23 0 20.24 0s1.81.24 2.47.72 1.08 1.05 1.28 1.71.3 1.62.3 2.88v.66Z',
  'M45.46.64v12.28h2.06V16h-5.44V.64h3.38Z',
  'm55.75.53 1.93 15.36h-3.46l-.18-2.76h-1.21l-.2 2.76h-3.5L50.85.53h4.89Zm-1.8 9.87c-.17-1.74-.34-3.89-.51-6.45-.34 2.94-.56 5.09-.65 6.45h1.16Z',
];

export function BrandLogo({
  className = '',
  compact = false,
  animateIntro = false,
  subtleWhenIdle = false,
}: BrandLogoProps) {
  const reduceMotion = useReducedMotion();
  const [animationKey, setAnimationKey] = useState(0);
  const [introFinished, setIntroFinished] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const height = compact ? 32 : 40;
  const width = compact ? 174 : 218;
  const outlineOnly = subtleWhenIdle && introFinished && !isHovered;

  useEffect(() => {
    if (!animateIntro || !subtleWhenIdle) return;

    const timeoutId = window.setTimeout(() => setIntroFinished(true), 2_000);
    return () => window.clearTimeout(timeoutId);
  }, [animationKey, animateIntro, subtleWhenIdle]);

  function replayOnHover() {
    setIsHovered(true);
    setIntroFinished(false);
    setAnimationKey((current) => current + 1);
  }

  if (!animateIntro || reduceMotion) {
    return <Image alt="Regula Send" className={className} height={height} src="/regula-send.svg" width={width} />;
  }

  return (
    <motion.svg
      key={animationKey}
      aria-labelledby="regula-send-title regula-send-description"
      className={className}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: outlineOnly ? 0.28 : 1, y: 0 }}
      onMouseEnter={replayOnHover}
      onMouseLeave={() => {
        setIsHovered(false);
        if (subtleWhenIdle) setIntroFinished(true);
      }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      role="img"
      viewBox="0 0 87 16"
    >
      <title id="regula-send-title">Regula Send</title>
      <desc id="regula-send-description">Marca Regula Send com barras de gráfico em animação e a assinatura Send.</desc>
      {wordmarkPaths.map((d) => (
        <path
          key={d}
          d={d}
          fill={outlineOnly ? 'none' : '#1d1d1b'}
          stroke={outlineOnly ? '#1d1d1b' : 'none'}
          strokeWidth={outlineOnly ? 0.45 : undefined}
        />
      ))}
      {[
        { x: 26.75, y: 4.88, height: 11.12, fill: '#232049', delay: 0.2 },
        { x: 31.25, y: 10.72, height: 5.28, fill: '#f59e11', delay: 0.31 },
        { x: 35.76, y: 0.64, height: 15.36, fill: '#82368c', delay: 0.42 },
      ].map((bar) => (
        <motion.rect
          key={bar.x}
          fill={outlineOnly ? 'none' : bar.fill}
          height={bar.height}
          initial={{ scaleY: 0.28 }}
          animate={{ scaleY: [0.28, 1.08, 0.94, 1] }}
          style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
          stroke={outlineOnly ? bar.fill : 'none'}
          strokeWidth={outlineOnly ? 0.45 : undefined}
          transition={{ delay: bar.delay, duration: 0.9, ease: 'easeInOut' }}
          width="3.66"
          x={bar.x}
          y={bar.y}
        />
      ))}
      <path
        d="M61.2 2.1h1.15v11.8H61.2z"
        fill={outlineOnly ? 'none' : '#82368c'}
        stroke={outlineOnly ? '#82368c' : 'none'}
        strokeWidth={outlineOnly ? 0.45 : undefined}
      />
      <motion.path
        d="m64.3 8.2 6.9-3.1-2.65 2.7 3.1 1.15-7.35.75-2.4 1.95.8-2.55-1.75-1.08 3.55.18Z"
        fill={outlineOnly ? 'none' : '#82368c'}
        initial={{ opacity: 0, x: -9, y: 2, rotate: -12 }}
        animate={{ opacity: [0, 1, 1, 0], x: [-9, 0, 4, 7], y: [2, 0, 0, -1], rotate: [-12, 0, 2, 4] }}
        transition={{ delay: 0.7, duration: 0.85, times: [0, 0.25, 0.67, 1], ease: 'easeOut' }}
      />
      <motion.text
        fill="#82368c"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7.2"
        fontWeight="700"
        initial={{ opacity: 0, scale: 0.7, x: -3, y: 1 }}
        animate={{ opacity: [0, 0, 1], scale: [0.7, 0.7, 1], x: [-3, -3, 0], y: [1, 1, 0] }}
        transition={{ delay: 0.7, duration: 1.2, times: [0, 0.58, 1], ease: 'easeOut' }}
        stroke={outlineOnly ? '#82368c' : 'none'}
        strokeWidth={outlineOnly ? 0.35 : undefined}
        x="65"
        y="10.85"
      >
        SEND
      </motion.text>
    </motion.svg>
  );
}
