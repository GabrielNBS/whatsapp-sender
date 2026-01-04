'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Linkedin, Code } from 'lucide-react';

interface DeveloperTagProps {
  isExpanded: boolean;      
}

export default function DeveloperTag({ isExpanded }: DeveloperTagProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative flex h-10 w-full cursor-pointer items-center justify-center overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center text-muted-foreground"
          >
            <Code size={16} />
          </motion.div>
        ) : !isHovered ? (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative whitespace-nowrap"
          >
            <p className="text-muted-foreground  flex flex-col text-xs font-medium">
              Desenvolvido por →
              <span className="relative p-1 inline-block mt-1 text-foreground">
                Gabriel Nascimento
                <span className="animate-shimmer absolute inset-0 -z-10 block rounded-sm bg-gradient-to-r from-transparent via-primary/20 to-transparent bg-[length:200%_100%]" />
              </span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="icons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-4"
          >
            <a
              href="https://www.linkedin.com/in/gabrielnascimento-dev/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
            <a
              href="https://github.com/GabrielNBS" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="GitHub"
            >
              <Github size={18} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
