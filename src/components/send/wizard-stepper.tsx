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
      className="flex items-center justify-center w-full my-6"
    >
      <LayoutGroup id="wizard-stepper">
        <div 
          role="list" 
          className="flex items-center gap-1 p-1 bg-muted/20 border border-border/30 rounded-full relative"
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
                    "relative flex items-center gap-2 px-4 py-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-none",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-step-pill"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm"
                      style={{ zIndex: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  
                  <div className="flex items-center gap-2 relative z-10">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <step.icon className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {index + 1}. {step.label}
                    </span>
                  </div>
                </motion.button>
                
                {index < steps.length - 1 && (
                  <ChevronRight 
                    className="w-3.5 h-3.5 mx-1 text-muted-foreground/40 shrink-0" 
                    aria-hidden="true" 
                  />
                )}
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
