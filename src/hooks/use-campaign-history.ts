'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  campaignHistoryApi,
  type CampaignHistoryItem,
  type CampaignHistorySummary,
} from '@/services/campaigns/campaignHistoryApi';

const ITEMS_PER_PAGE = 8;

export type CampaignHistoryFilter = 'recent' | 'oldest' | 'failed';

export function useCampaignHistory() {
  const [campaigns, setCampaigns] = useState<CampaignHistorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignHistoryItem | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<CampaignHistoryFilter>('recent');

  const filteredCampaigns = useMemo(() => {
    if (activeFilter === 'failed') {
      return campaigns.filter((campaign) => campaign.failedCount > 0);
    }
    if (activeFilter === 'oldest') {
      return [...campaigns].sort(
        (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
      );
    }
    return campaigns;
  }, [activeFilter, campaigns]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE));
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const failedCampaignCount = campaigns.filter((campaign) => campaign.failedCount > 0).length;

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setCampaigns(await campaignHistoryApi.list());
    } catch (error) {
      console.error('Error fetching campaign history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const selectCampaign = useCallback(async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedCampaign(null);
    setIsDetailLoading(true);
    try {
      setSelectedCampaign(await campaignHistoryApi.get(campaignId));
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      setSelectedCampaignId(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const closeCampaignDetails = () => {
    setSelectedCampaign(null);
    setSelectedCampaignId(null);
  };

  const changeFilter = (filter: CampaignHistoryFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  return {
    activeFilter,
    campaigns,
    changeFilter,
    closeCampaignDetails,
    currentPage,
    failedCampaignCount,
    filteredCampaigns,
    isDetailLoading,
    loading,
    paginatedCampaigns,
    selectCampaign,
    selectedCampaign,
    selectedCampaignId,
    setCurrentPage,
    totalPages,
  };
}
