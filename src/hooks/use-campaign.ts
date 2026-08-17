import { useState, useCallback } from 'react';
import {
  campaignApi,
  type CampaignRecord,
  type CompleteCampaignPayload,
  type CreateCampaignPayload,
} from '@/services/campaigns/campaignApi';

export function useCampaign() {
  const [currentCampaign, setCurrentCampaign] = useState<CampaignRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Create a new campaign when sending starts
   */
  const createCampaign = useCallback(async (params: CreateCampaignPayload): Promise<CampaignRecord | null> => {
    setIsLoading(true);
    try {
      const campaign = await campaignApi.create(params);
      setCurrentCampaign(campaign);
      console.log('[useCampaign] Campaign created:', campaign.id);
      return campaign;
    } catch (error) {
      console.error('[useCampaign] Error creating campaign:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);


  const completeCampaign = useCallback(async (metrics: CompleteCampaignPayload): Promise<boolean> => {
    if (!currentCampaign) {
      console.warn('[useCampaign] No active campaign to complete');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await campaignApi.complete(currentCampaign.id, metrics);
      console.log('[useCampaign] Campaign completed:', result);
      
      // Clear current campaign
      setCurrentCampaign(null);
      return true;
    } catch (error) {
      console.error('[useCampaign] Error completing campaign:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign]);

  /**
   * Clear current campaign without completing (e.g., on abort)
   */
  const clearCampaign = useCallback(() => {
    setCurrentCampaign(null);
  }, []);

  return {
    currentCampaign,
    isLoading,
    createCampaign,
    completeCampaign,
    clearCampaign,
  };
}
