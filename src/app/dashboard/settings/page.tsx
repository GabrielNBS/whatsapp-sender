import { Construction, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Card className="w-full max-w-md text-center border-none">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-muted rounded-full">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Construction className="w-12 h-12 text-yellow-500/50" />
            <p className="text-lg font-medium">Em Construção</p>
            <p className="text-sm">
              Estamos trabalhando duro para trazer opções de personalização avançadas para você.
              Esta funcionalidade estará disponível em uma atualização futura.
            </p>
          </div>
          <div className="pt-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/send">Voltar para Envios</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
