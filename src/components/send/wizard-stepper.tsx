import { motion, LayoutGroup } from "framer-motion";
import { ChevronRight } from "lucide-react";
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
      className="flex items-center justify-center w-full mb-10"
    >
      <LayoutGroup id="wizard-stepper">
        <div
          role="list"
          className="flex items-center gap-1 p-1 bg-card/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full relative shadow-xl "
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
                    "relative flex items-center gap-2.5 px-5 py-2.5 rounded-full outline-none transition-all group",
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

                  <div className="flex items-center gap-2.5 relative z-10">
                    <step.icon className={cn("w-3.5 h-3.5", isActive ? "animate-pulse" : "opacity-50 group-hover:opacity-100 transition-opacity")} />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2rem] whitespace-nowrap">
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
