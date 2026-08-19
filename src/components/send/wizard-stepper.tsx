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
      className="mb-4 flex w-full shrink-0 items-center justify-center px-2 sm:mb-6"
    >
      <LayoutGroup id="wizard-stepper">
        <div
          role="list"
          className="no-scrollbar relative flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
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
                    <step.icon className={cn("size-4", !isActive && "opacity-70 group-hover:opacity-100")} />
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
