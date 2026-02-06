/**
 * useCampaign Hook
 * 
 * Manages campaign lifecycle from the frontend.
 * Used by useSender to track sending campaigns.
 */

import { useState, useCallback } from 'react';

interface Campaign {
  id: string;
  name: string;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string | null;
}

interface CreateCampaignParams {
  name: string;
  templateName?: string;
  totalContacts: number;
}

interface CompleteCampaignParams {
  sentCount: number;
  failedCount: number;
}

export function useCampaign() {
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Create a new campaign when sending starts
   */
  const createCampaign = useCallback(async (params: CreateCampaignParams): Promise<Campaign | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        console.error('[useCampaign] Failed to create campaign');
        return null;
      }

      const campaign = await response.json();
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

  /**
   * Complete the current campaign and trigger reports
   */
  const completeCampaign = useCallback(async (metrics: CompleteCampaignParams): Promise<boolean> => {
    if (!currentCampaign) {
      console.warn('[useCampaign] No active campaign to complete');
      return false;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${currentCampaign.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });

      if (!response.ok) {
        console.error('[useCampaign] Failed to complete campaign');
        return false;
      }

      const result = await response.json();
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
