import { motion, LayoutGroup } from "framer-motion";
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
  return (
    <nav
      aria-label="Progresso do envio"
      className="mb-4 flex w-full shrink-0 items-center justify-center px-2 sm:mb-6 lg:mb-10 [@media(max-height:700px)]:lg:mb-4"
    >
      <LayoutGroup id="wizard-stepper">
        <div
          role="list"
          className="no-scrollbar relative flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-white/20 bg-card/40 p-1 shadow-xl backdrop-blur-xl dark:border-white/10 sm:gap-1"
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
                    "group relative flex items-center gap-1.5 rounded-full px-3 py-2.5 outline-none transition-all sm:gap-2.5 sm:px-5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-step-pill"
                      className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/20"
                      style={{ zIndex: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-1.5 sm:gap-2.5">
                    <step.icon className={cn("w-3.5 h-3.5", isActive ? "animate-pulse" : "opacity-50 group-hover:opacity-100 transition-opacity")} />
                    <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.12rem] sm:text-[9px] sm:tracking-[0.2rem]">
                      {step.label}
                    </span>
                  </div>
                </motion.button>

                {index < steps.length - 1 && (
                  <div className="mx-1 h-1 w-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
