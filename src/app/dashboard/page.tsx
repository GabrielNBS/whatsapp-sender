'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { MessageSquare, Users, Activity, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { contacts, groups } = useAppStore();
  const [status, setStatus] = useState('Verificando...');

  useEffect(() => {
    fetch('/api/qr')
      .then(res => res.json())
      .then(data => {
         if (data.status?.isAuthenticated) setStatus('Conectado');
         else setStatus('Desconectado');
      })
      .catch(() => setStatus('Erro ao verificar status'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Olá Veed's Burger</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status da Conexão</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp Client Service
            </p>
          </CardContent>
        </Card>

        {/* Contacts Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              Em {groups.length} grupos
            </p>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Envio Rápido</CardTitle>
             <MessageSquare className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
              <Link href="/dashboard/send">
                 <Button className="w-full mt-1 " size="sm">
                    Nova Campanha <ExternalLink className="ml-2 h-3 w-3" />
                 </Button>
              </Link>
           </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-white shadow-md">
         <Card className="bg-slate-900 text-white border-none">
            <CardHeader>
               <CardTitle className='text-slate-900'>Bem-vindo ao WhatsApp Sender</CardTitle>
               <CardDescription className="text-slate-400">
                  Sistema de disparos em massa e gerenciamento de contatos <br />
                  Utilize o menu lateral para gerenciar seus grupos de contatos ou iniciar um novo envio de mensagens. 
                  Lembre-se de manter o WhatsApp conectado no dispositivo servidor.
               </CardDescription>
            </CardHeader>
         </Card>
      </div>
    </div>
  );
}
