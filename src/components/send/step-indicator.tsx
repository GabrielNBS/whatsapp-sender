import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  steps: {
    id: number;
    label: string;
    icon: React.ElementType;
  }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full flex justify-between items-center relative mb-8 px-4">
      {/* Background Line */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full -z-10" />

      {/* Progress Line */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 origin-left"
        initial={{ scaleX: 0 }}
        animate={{
          scaleX: (currentStep - 1) / (steps.length - 1),
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {steps.map((step) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2 relative">
            <motion.div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-background",
                isActive
                  ? "border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                  : isCompleted
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted text-muted-foreground"
              )}
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </motion.div>
            <span
              className={cn(
                "text-xs font-medium absolute top-full mt-2 whitespace-nowrap transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
