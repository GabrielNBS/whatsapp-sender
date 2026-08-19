'use client';

import type { ComponentType } from 'react';
import { SplitText } from '@/components/ui/split-text';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  RotateCcw,
  Users,
  AlertTriangle,
  Zap,
  CalendarDays,
  MessageSquare,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCampaignHistory, type CampaignHistoryFilter } from '@/hooks/use-campaign-history';
import type { CampaignHistoryItem, CampaignHistorySummary } from '@/services/campaigns/campaignHistoryApi';

// ===================================================
// TYPES
// ===================================================

// ===================================================
// FORMAT HELPERS
// ===================================================

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(start: string, end: string | null) {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function successRate(sent: number, total: number) {
  if (total === 0) return 0;
  return Math.round((sent / total) * 100);
}

// ===================================================
// CAMPAIGN ROW
// ===================================================

function CampaignRow({
  campaign,
  onClick,
}: {
  campaign: CampaignHistorySummary;
  onClick: () => void;
}) {
  const rate = successRate(campaign.sentCount, campaign.totalContacts);
  const isComplete = !!campaign.completedAt;
  const hasFails = campaign.failedCount > 0;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: icon + info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              isComplete && !hasFails && 'bg-emerald-100 dark:bg-emerald-950',
              isComplete && hasFails && 'bg-amber-100 dark:bg-amber-950',
              !isComplete && 'bg-muted'
            )}
          >
            {isComplete && !hasFails && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            {isComplete && hasFails && (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            {!isComplete && <Clock className="w-5 h-5 text-muted-foreground" />}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">
              {campaign.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(campaign.startedAt)}
              {campaign.completedAt && (
                <span className="ml-2 text-muted-foreground/60">
                  · {formatDuration(campaign.startedAt, campaign.completedAt)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center: quick metrics */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Contatos</p>
            <p className="text-sm font-bold text-foreground">
              {campaign.totalContacts}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Sucesso</p>
            <p className="text-sm font-bold text-emerald-600">
              {campaign.sentCount}
            </p>
          </div>
          {campaign.failedCount > 0 && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Falhas</p>
              <p className="text-sm font-bold text-red-500">
                {campaign.failedCount}
              </p>
            </div>
          )}
        </div>

        {/* Right: progress bar + arrow */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 hidden md:block">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{rate}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  rate === 100
                    ? 'bg-emerald-500'
                    : rate >= 80
                    ? 'bg-emerald-400'
                    : rate >= 50
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                )}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </motion.button>
  );
}

// ===================================================
// DETAIL VIEW
// ===================================================

function CampaignDetail({
  campaign,
  onBack,
}: {
  campaign: CampaignHistoryItem;
  onBack: () => void;
}) {
  const rate = successRate(campaign.sentCount, campaign.totalContacts);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao histórico
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {campaign.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Iniciada em {formatDate(campaign.startedAt)}
              {campaign.completedAt && (
                <span>
                  {' '}
                  · Duração: {formatDuration(campaign.startedAt, campaign.completedAt)}
                </span>
              )}
            </p>
          </div>
          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold',
              campaign.completedAt
                ? campaign.failedCount === 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {campaign.completedAt
              ? campaign.failedCount === 0
                ? 'Concluída'
                : 'Parcial'
              : 'Em andamento'}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <MetricTile
            icon={Users}
            label="Total Contatos"
            value={campaign.totalContacts}
            color="text-foreground"
            bg="bg-muted/50"
          />
          <MetricTile
            icon={CheckCircle2}
            label="Entregues"
            value={campaign.sentCount}
            color="text-emerald-600"
            bg="bg-emerald-50 dark:bg-emerald-950/50"
          />
          <MetricTile
            icon={XCircle}
            label="Falhas"
            value={campaign.failedCount}
            color={campaign.failedCount > 0 ? 'text-red-500' : 'text-muted-foreground'}
            bg={campaign.failedCount > 0 ? 'bg-red-50 dark:bg-red-950/50' : 'bg-muted/50'}
          />
          <MetricTile
            icon={Zap}
            label="Taxa Sucesso"
            value={`${rate}%`}
            color={
              rate === 100
                ? 'text-emerald-600'
                : rate >= 80
                ? 'text-emerald-500'
                : rate >= 50
                ? 'text-amber-600'
                : 'text-red-500'
            }
            bg="bg-muted/50"
          />
        </div>
      </div>

      {/* Template Preview */}
      {campaign.templateContent && (() => {
        const mediaObj = campaign.templateMedia
          ? (() => { try { return JSON.parse(campaign.templateMedia); } catch { return null; } })()
          : null;
        const isImage = mediaObj?.mimetype?.startsWith('image/');

        return (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            {/* Section Header + Model Badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Mensagem Enviada
              </h3>
              {campaign.templateTitle && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <MessageSquare className="w-3 h-3" />
                  {campaign.templateTitle}
                </span>
              )}
            </div>

            {/* Content: Message + Media */}
            <div className={cn(
              'flex gap-4',
              isImage ? 'flex-col sm:flex-row' : 'flex-col'
            )}>
              {/* Message Bubble */}
              <div className="flex-1">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl rounded-tl-sm p-4 max-w-md">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {campaign.templateContent}
                  </p>
                </div>
              </div>

              {/* Media Preview */}
              {isImage && mediaObj?.data && (
                <div className="shrink-0">
                  <div className="relative group w-full sm:w-48 h-48 rounded-xl overflow-hidden border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:${mediaObj.mimetype};base64,${mediaObj.data}`}
                      alt={mediaObj.filename || 'Mídia do template'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {mediaObj.filename && (
                      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2">
                        <p className="flex items-center gap-1 truncate text-xs font-medium text-white">
                          <ImageIcon className="w-3 h-3" />
                          {mediaObj.filename}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Non-image media indicator */}
              {mediaObj && !isImage && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground w-fit">
                  <ImageIcon className="w-4 h-4" />
                  <span>{mediaObj.filename || 'Arquivo anexado'}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {mediaObj.mimetype?.split('/')[1] || 'arquivo'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Failed Contacts Triage */}
      {campaign.failedDetails.length > 0 && (
        <div className="bg-card border border-red-200 dark:border-red-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Contatos com Falha ({campaign.failedDetails.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Reenviar para falhas
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border pr-1">
            {campaign.failedDetails.map((detail, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg px-3 py-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {detail.contactName}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {detail.contactPhone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ===================================================
// METRIC TILE (Mini Card)
// ===================================================

function MetricTile({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn('rounded-lg p-3 flex flex-col items-center justify-center border border-border', bg)}>
      <Icon className={cn('w-5 h-5 mb-1', color)} />
      <span className={cn('text-2xl font-bold', color)}>{value}</span>
      <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ===================================================
// MAIN PAGE
// ===================================================

const FILTERS: { key: CampaignHistoryFilter; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'recent', label: 'Mais Recentes', icon: ArrowDownNarrowWide },
  { key: 'oldest', label: 'Mais Antigas', icon: ArrowUpNarrowWide },
  { key: 'failed', label: 'Com Falhas', icon: AlertTriangle },
];

export function HistorySheetContent() {
  const {
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
  } = useCampaignHistory();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SplitText
            text="Histórico de Campanhas"
            as="h1"
            className="text-2xl font-bold tracking-tight text-foreground"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe todas as suas transmissões anteriores
          </p>
        </div>

        {!selectedCampaignId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-full px-3 py-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campanha' : 'campanhas'}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      {!selectedCampaignId && !loading && campaigns.length > 0 && (
        <div className="flex items-center gap-2">
          {FILTERS.map(({ key, label, icon: FIcon }) => (
            <button
              key={key}
              onClick={() => changeFilter(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                activeFilter === key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              )}
            >
              <FIcon className="w-3 h-3" />
              {label}
              {key === 'failed' && (
                <span className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  activeFilter === key
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                )}>
                  {failedCampaignCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedCampaign ? (
          <CampaignDetail
            key="detail"
            campaign={selectedCampaign}
            onBack={closeCampaignDetails}
          />
        ) : selectedCampaignId && isDetailLoading ? (
          <motion.div
            key="detail-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando detalhes da campanha...</p>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              Carregando histórico...
            </p>
          </motion.div>
        ) : campaigns.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                Nenhuma campanha encontrada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Quando você enviar a primeira campanha, ela aparecerá aqui.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`list-page-${currentPage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {paginatedCampaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                onClick={() => void selectCampaign(campaign.id)}
              />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show first, last, and nearby pages
                      if (p === 1 || p === totalPages) return true;
                      return Math.abs(p - currentPage) <= 1;
                    })
                    .map((page, idx, arr) => {
                      const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <span key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-1 text-xs text-muted-foreground">…</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0 text-xs"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </span>
                      );
                    })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
