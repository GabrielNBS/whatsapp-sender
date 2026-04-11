import { NextRequest, NextResponse } from 'next/server';
import { getQueueService } from '@/lib/QueueService';
import { getCampaignService } from '@/lib/CampaignService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, recipients, message, media } = body;

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato fornecido' }, { status: 400 });
    }

    const campaignService = getCampaignService();
    // Cria campanha no banco
    const campaign = await campaignService.createCampaign({
      name: name || `Campanha ${new Date().toLocaleString('pt-BR')}`,
      totalContacts: recipients.length,
    });

    const queueService = getQueueService();
    
    // Inicia a fila no background
    await queueService.startCampaign(campaign.id, campaign.name, recipients, message, media);

    return NextResponse.json({ 
      success: true, 
      campaignId: campaign.id 
    });

  } catch (error: unknown) {
    console.error('[API] Error starting campaign:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || 'Falha ao iniciar campanha' },
      { status: 500 }
    );
  }
}
