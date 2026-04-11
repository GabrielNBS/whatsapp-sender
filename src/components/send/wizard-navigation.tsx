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
    <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isFirstStep || isSending}
        className={cn("gap-2 rounded-full", isFirstStep && "invisible")}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      <Button
        onClick={onNext}
        disabled={isNextDisabled || isSending}
        variant={isLastStep ? "success" : "default"}
        className="rounded-full px-4"
        asChild
      >
        <motion.button
          whileHover={!(isNextDisabled || isSending) ? "hover" : ""}
          whileTap={!(isNextDisabled || isSending) ? { scale: 0.98 } : {}}
          className="flex items-center gap-2"
        >
          {isLastStep ? (
            <>
              {isSending ? "Enviando..." : "Confirmar Envio"}
              <motion.div
                variants={{ hover: { x: 4 } }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Send className="w-4 h-4" />
              </motion.div>
            </>
          ) : (
            <>
              Próximo
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
