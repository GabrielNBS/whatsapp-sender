'use client';

import { motion, LayoutGroup, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  icon: React.ElementType;
}

interface WizardStepperProps {
  currentStep: number;
  steps: Step[];
  onStepClick?: (stepId: number) => void;
}

export function WizardStepper({ currentStep, steps, onStepClick }: WizardStepperProps) {
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Progresso do envio"
      className="mb-4 flex w-full shrink-0 items-center justify-center px-2 sm:mb-6"
    >
      <LayoutGroup id="wizard-stepper">
        <div
          role="list"
          className="no-scrollbar relative flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-primary/10 shadow-sm bg-background/50 p-1"
        >
          {steps.map((step, index) => {
            const isActive =
              (step.id === 0 && currentStep === 0) ||
              (step.id === 1 && currentStep === 1) ||
              (step.id === 2 && (currentStep === 2 || currentStep === 3));

            return (
              <div key={step.id} role="listitem" className="flex items-center">
                <motion.button
                  onClick={() => onStepClick?.(step.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "group relative flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 outline-none transition-colors sm:px-5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-step-pill"
                      className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                      style={{ zIndex: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-1.5 sm:gap-2.5">
                    <motion.span
                      className="relative flex size-5 items-center justify-center"
                      initial={false}
                      animate={
                        isActive && !reduceMotion
                          ? {
                              y: [0, -1.5, 0],
                              rotate: [0, -4, 4, 0],
                              scale: [1, 1.12, 1],
                            }
                          : { y: 0, rotate: 0, scale: 1 }
                      }
                      transition={
                        isActive && !reduceMotion
                          ? {
                              duration: 1.25,
                              ease: 'easeInOut',
                              repeat: Infinity,
                              repeatDelay: 1.1,
                            }
                          : { duration: 0.2 }
                      }
                    >
                      {isActive && !reduceMotion ? (
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-primary-foreground/20"
                          animate={{ opacity: [0, 0.55, 0], scale: [0.65, 1.35, 1.5] }}
                          transition={{ duration: 1.25, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.1 }}
                        />
                      ) : null}
                      <step.icon
                        className={cn(
                          "relative z-10 size-4",
                          !isActive && "opacity-70 group-hover:opacity-100"
                        )}
                      />
                    </motion.span>
                    <span className="whitespace-nowrap text-xs font-semibold sm:text-sm">
                      {step.label}
                    </span>
                  </div>
                </motion.button>

                {index < steps.length - 1 && (
                  <div className="mx-0.5 h-px w-3 bg-border sm:w-5" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
