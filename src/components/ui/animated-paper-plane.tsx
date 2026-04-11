"use client";

import { motion } from "framer-motion";

const PARTICLES = [
    { w: 5, h: 6, opacity: 0.28, left: "20%", top: "55%", xEnd: -30, dur: 2.5 },
    { w: 7, h: 5, opacity: 0.35, left: "28%", top: "65%", xEnd: -50, dur: 2.8 },
    { w: 4, h: 4, opacity: 0.20, left: "36%", top: "55%", xEnd: -66, dur: 3.1 },
    { w: 6, h: 7, opacity: 0.32, left: "44%", top: "65%", xEnd: -84, dur: 3.4 },
    { w: 5, h: 5, opacity: 0.22, left: "52%", top: "55%", xEnd: -100, dur: 3.7 },
    { w: 8, h: 6, opacity: 0.38, left: "60%", top: "65%", xEnd: -120, dur: 4.0 },
];

export function AnimatedPaperPlane({ className = "" }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            {/* Trailing particles */}
            {PARTICLES.map((p, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: p.w,
                        height: p.h,
                        background: `rgba(37, 211, 102, ${p.opacity})`,
                        left: p.left,
                        top: p.top,
                    }}
                    animate={{
                        opacity: [0, 0.6, 0],
                        scale: [0.5, 1.2, 0],
                        x: [0, p.xEnd / 2, p.xEnd],
                        y: [0, i % 2 === 0 ? -8 : 8, 15],
                    }}
                    transition={{
                        duration: p.dur,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut",
                    }}
                />
            ))}

            {/* Glow effect behind plane */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <div
                    className="w-24 h-24 rounded-full blur-2xl"
                    style={{
                        background: "radial-gradient(circle, rgba(37, 211, 102, 0.3) 0%, rgba(18, 140, 126, 0.1) 60%, transparent 100%)",
                    }}
                />
            </motion.div>

            {/* SVG Paper Plane */}
            <svg
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-lg"
            >
                <defs>
                    <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#25D366" />
                        <stop offset="50%" stopColor="#128C7E" />
                        <stop offset="100%" stopColor="#075E54" />
                    </linearGradient>
                    <linearGradient id="planeShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#128C7E" />
                        <stop offset="100%" stopColor="#075E54" />
                    </linearGradient>
                    <linearGradient id="planeHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#25D366" />
                        <stop offset="100%" stopColor="#5DFFA0" />
                    </linearGradient>
                </defs>

                {/* Trail lines */}
                <motion.path
                    d="M 15 68 Q 30 65 45 62"
                    stroke="url(#planeGradient)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ opacity: [0.1, 0.4, 0.1], pathLength: [0.3, 1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.path
                    d="M 20 74 Q 32 72 42 68"
                    stroke="url(#planeGradient)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ opacity: [0.05, 0.25, 0.05], pathLength: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />

                {/* Main paper plane body */}
                {/* Top wing - lighter */}
                <path
                    d="M 50 38 L 95 55 L 62 58 Z"
                    fill="url(#planeHighlight)"
                    opacity="0.95"
                />
                {/* Bottom wing - darker */}
                <path
                    d="M 50 38 L 62 58 L 55 78 Z"
                    fill="url(#planeShadow)"
                    opacity="0.9"
                />
                {/* Center fold line */}
                <path
                    d="M 50 38 L 62 58"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="0.5"
                />
                {/* Nose tip accent */}
                <path
                    d="M 95 55 L 62 58 L 55 78 Z"
                    fill="url(#planeGradient)"
                    opacity="0.85"
                />
            </svg>
        </div>
    );
}
