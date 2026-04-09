import { motion } from "framer-motion";
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
    <div className="flex items-center justify-center w-full my-6">
      <div className="flex items-center gap-1 p-1 bg-muted/20 border border-border/30 rounded-full">
        {steps.map((step, index) => {
          const isActive = 
            (step.id === 0 && currentStep === 0) ||
            (step.id === 1 && currentStep === 1) ||
            (step.id === 2 && (currentStep === 2 || currentStep === 3));

          return (
            <div key={step.id} className="flex items-center">
              <motion.button
                key={step.id}
                onClick={() => onStepClick?.(step.id)}
                initial={false}
                whileHover={!isActive ? { scale: 1.02, backgroundColor: "rgba(var(--muted), 0.6)" } : {}}
                whileTap={!isActive ? { scale: 0.98 } : {}}
                animate={{
                  backgroundColor: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-200",
                  isActive ? "shadow-sm cursor-default" : "cursor-pointer"
                )}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <step.icon className="w-3.5 h-3.5" />
                </motion.div>
                <span className="text-xs font-semibold whitespace-nowrap">
                  {index + 1}. {step.label}
                </span>
              </motion.button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 mx-1 text-muted-foreground/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
