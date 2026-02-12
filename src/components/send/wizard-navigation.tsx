import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";

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
        className={cn("gap-2", isFirstStep && "invisible")}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      <Button
        onClick={onNext}
        disabled={isNextDisabled || isSending}
        className={cn(
          "gap-2 min-w-[120px] transition-all duration-300",
          isLastStep ? "bg-primary hover:bg-primary/90" : "bg-card hover:bg-accent text-foreground border border-border"
        )}
        variant={isLastStep ? "default" : "outline"}
      >
        {isLastStep ? (
          <>
            {isSending ? "Enviando..." : "Confirmar Envio"}
            <Send className="w-4 h-4 ml-1" />
          </>
        ) : (
          <>
            Próximo
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}
