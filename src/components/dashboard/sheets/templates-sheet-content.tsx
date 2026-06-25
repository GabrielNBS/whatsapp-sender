'use client';

import { useState, useCallback } from 'react';
import { Template } from '@/types/templates';

// Hooks
import { useTemplates } from '@/hooks/useTemplates';
import { useTemplateFilters } from '@/hooks/useTemplateFilters';
import { useTemplateClipboard } from '@/hooks/useTemplateClipboard';

// Subcomponentes
import { TemplatesHeader } from './components/templates/TemplatesHeader';
import { TemplateFilters } from './components/templates/TemplateFilters';
import { TemplateGrid } from './components/templates/TemplateGrid';
import { EmptyTemplatesState } from './components/templates/EmptyTemplatesState';
import { TemplatesLoadingSkeleton } from './components/templates/TemplatesLoadingSkeleton';
import { ConfirmDeleteTemplateDialog } from './components/templates/ConfirmDeleteTemplateDialog';
import { TemplateSheet } from '@/components/dashboard/templates/template-sheet';

export function TemplatesSheetContent() {
  const {
    templates,
    isLoading,
    error,
    deletingIds,
    deleteTemplate,
    handleSaveSuccess,
  } = useTemplates();

  const {
    filter,
    setFilter,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    categories,
    filteredTemplates,
    clearFilters,
  } = useTemplateFilters(templates);

  const { copyToClipboard } = useTemplateClipboard();

  // Estados locais de controle de diálogos e sheets
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [duplicateSourceTemplate, setDuplicateSourceTemplate] = useState<Template | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const handleOpenCreate = useCallback(() => {
    setEditingTemplate(null);
    setDuplicateSourceTemplate(null);
    setIsSheetOpen(true);
  }, []);

  const handleOpenEdit = useCallback((template: Template) => {
    setEditingTemplate(template);
    setDuplicateSourceTemplate(null);
    setIsSheetOpen(true);
  }, []);

  const handleOpenDuplicate = useCallback((template: Template) => {
    setEditingTemplate(null);
    setDuplicateSourceTemplate(template);
    setIsSheetOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingTemplateId) {
      const success = await deleteTemplate(deletingTemplateId);
      if (success) {
        setDeletingTemplateId(null);
      }
    }
  }, [deletingTemplateId, deleteTemplate]);

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Cabeçalho com Ação de Criar (LAYOUT-001) */}
      <TemplatesHeader
        onCreateClick={handleOpenCreate}
        totalCount={templates.length}
      />

      {/* Barra de Filtros e Pesquisa */}
      <TemplateFilters
        filter={filter}
        onFilterChange={setFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        onClearFilters={clearFilters}
      />

      {/* Conteúdo Principal (Grid / Loading / Vazio / Erro) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {isLoading ? (
          <TemplatesLoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-red-500">
            <p className="font-semibold text-lg">Erro ao carregar modelos</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <EmptyTemplatesState
            isFiltered={templates.length > 0}
            onClearFilters={clearFilters}
          />
        ) : (
          <TemplateGrid
            templates={filteredTemplates}
            deletingIds={deletingIds}
            onEdit={handleOpenEdit}
            onDelete={setDeletingTemplateId}
            onDuplicate={handleOpenDuplicate}
            onCopy={copyToClipboard}
          />
        )}
      </div>

      {/* Diálogo de Criação/Edição/Duplicação de Template */}
      <TemplateSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        template={duplicateSourceTemplate || editingTemplate}
        isDuplicate={!!duplicateSourceTemplate}
        onSave={handleSaveSuccess}
      />

      {/* Diálogo Acessível de Exclusão (DELETE-001) */}
      <ConfirmDeleteTemplateDialog
        isOpen={!!deletingTemplateId}
        onClose={() => setDeletingTemplateId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deletingTemplateId ? !!deletingIds[deletingTemplateId] : false}
      />
    </div>
  );
}
export default TemplatesSheetContent;
