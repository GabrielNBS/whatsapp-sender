import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
  isSending: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isNextDisabled,
  isSending,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isFirstStep || isSending}
        asChild
        className={cn(
          "h-11 gap-2 rounded-2xl px-3 text-[9px] font-bold uppercase tracking-[0.12rem] text-muted-foreground transition-all hover:text-primary sm:h-12 sm:gap-3 sm:px-6 sm:text-[10px] sm:tracking-[0.2rem]",
          isFirstStep && "invisible pointer-events-none"
        )}
      >
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Voltar</span>
        </motion.button>
      </Button>

      <Button
        onClick={onNext}
        disabled={isNextDisabled || isSending}
        asChild
        className={cn(
          "h-11 gap-2 rounded-2xl px-4 text-[9px] font-bold uppercase tracking-[0.12rem] shadow-xl shadow-primary/10 transition-all sm:h-12 sm:gap-3 sm:px-8 sm:text-[10px] sm:tracking-[0.2rem]",
          isLastStep ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-primary text-primary-foreground"
        )}
      >
        <motion.button
          whileHover="hover"
          whileTap={{ scale: 0.98 }}
        >
          {isLastStep ? (
            <>
              <span>{isSending ? "Enviando..." : "Confirmar Envio"}</span>
              <motion.div
                variants={{ hover: { x: 4 } }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Send className="w-4 h-4" />
              </motion.div>
            </>
          ) : (
            <>
              <span>Próximo</span>
              <motion.div
                variants={{ hover: { x: 4 } }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </>
          )}
        </motion.button>
      </Button>
    </div>
  );
}
