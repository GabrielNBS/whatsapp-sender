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
    <div className="flex justify-between items-center w-full">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isFirstStep || isSending}
        asChild
        className={cn(
          "gap-3 h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2rem] text-muted-foreground hover:text-primary transition-all", 
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
          "h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2rem] transition-all shadow-xl shadow-primary/10 gap-3",
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
