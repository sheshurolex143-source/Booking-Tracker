import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, Plus, X } from 'lucide-react';
import { computeSummaryMetrics, filterAndSortRecords } from '../shared/logic';
import {
  CancellationInput,
  CancellationRecord,
  CurrencyCode,
  FilterCriteria,
  FollowUpInput,
  RefundStatus,
  TrackerSettings,
} from '../shared/types';
import { CancellationModal } from './components/CancellationModal';
import { CancellationTable } from './components/CancellationTable';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DetailDrawer } from './components/DetailDrawer';
import { FilterToolbar } from './components/FilterToolbar';
import { SettingsView } from './components/SettingsView';
import { Sidebar, WorkspaceSection } from './components/Sidebar';
import { SummaryStrip } from './components/SummaryStrip';
import {
  ApiRequestError,
  createCancellationRecord,
  deleteCancellationRecord,
  fetchCancellations,
  logFollowUpRecord,
  updateCancellationRecord,
  updateSettings,
} from './services/api';

const DEFAULT_FILTERS: FilterCriteria = {
  search: '',
  status: 'All',
  category: 'All',
  provider: '',
  onlyNeedsFollowUp: false,
  sortBy: 'overdue_first',
};

const DEFAULT_SETTINGS: TrackerSettings = {
  staleThresholdDays: 7,
  defaultCurrency: 'USD',
  updatedAt: new Date().toISOString(),
};

export function App() {
  const [records, setRecords] = useState<CancellationRecord[]>([]);
  const [settings, setSettings] = useState<TrackerSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<WorkspaceSection>('all');
  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CancellationRecord | null>(null);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [drawerFocusFollowUp, setDrawerFocusFollowUp] = useState(false);

  const [recordPendingDelete, setRecordPendingDelete] = useState<CancellationRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetchCancellations();
      setRecords(response.data);
      setSettings(response.settings);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setApiError(err.message);
      } else {
        setApiError('Unable to reach the cancellation tracker API. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = useCallback((message: string) => {
    setBannerMessage(message);
    window.setTimeout(() => {
      setBannerMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  }, []);

  const summary = useMemo(
    () => computeSummaryMetrics(records, settings.staleThresholdDays),
    [records, settings.staleThresholdDays]
  );

  const providers = useMemo(() => {
    const unique = new Set(records.map((r) => r.provider));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const visibleRecords = useMemo(
    () => filterAndSortRecords(records, filters, settings.staleThresholdDays),
    [records, filters, settings.staleThresholdDays]
  );

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId) ?? null,
    [records, selectedRecordId]
  );

  const handleSelectSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (section === 'all') {
      setFilters((prev) => ({ ...prev, status: 'All', onlyNeedsFollowUp: false }));
    } else if (section === 'needs_followup') {
      setFilters((prev) => ({
        ...prev,
        status: 'All',
        onlyNeedsFollowUp: true,
        sortBy: 'overdue_first',
      }));
    } else if (section === 'refunded') {
      setFilters((prev) => ({
        ...prev,
        status: RefundStatus.Refunded,
        onlyNeedsFollowUp: false,
      }));
    }
  };

  const handleFilterChange = (patch: Partial<FilterCriteria>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      if (next.onlyNeedsFollowUp && activeSection !== 'needs_followup') {
        setActiveSection('needs_followup');
      } else if (!next.onlyNeedsFollowUp && next.status === RefundStatus.Refunded) {
        setActiveSection('refunded');
      } else if (activeSection !== 'settings') {
        setActiveSection('all');
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    if (activeSection !== 'settings') {
      setActiveSection('all');
    }
  };

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (record: CancellationRecord) => {
    setSelectedRecordId(null);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleSaveCancellation = async (input: CancellationInput, existingId?: string) => {
    if (existingId) {
      const updated = await updateCancellationRecord(existingId, input);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Updated "${updated.bookingTitle}".`);
    } else {
      const created = await createCancellationRecord(input);
      setRecords((prev) => [created, ...prev]);
      showToast(`Logged cancellation for "${created.bookingTitle}".`);
      if (activeSection === 'settings') {
        setActiveSection('all');
      }
    }
  };

  const handleLogFollowUp = async (id: string, input: FollowUpInput) => {
    const updated = await logFollowUpRecord(id, input);
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast(`Follow-up logged for "${updated.bookingTitle}". Timestamp refreshed.`);
  };

  const handleConfirmDelete = async () => {
    if (!recordPendingDelete) return;
    setDeleting(true);
    try {
      await deleteCancellationRecord(recordPendingDelete.id);
      setRecords((prev) => prev.filter((r) => r.id !== recordPendingDelete.id));
      if (selectedRecordId === recordPendingDelete.id) {
        setSelectedRecordId(null);
      }
      showToast(`Deleted "${recordPendingDelete.bookingTitle}".`);
      setRecordPendingDelete(null);
    } catch (err) {
      setApiError(
        err instanceof ApiRequestError ? err.message : 'Failed to delete cancellation record.'
      );
      setRecordPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveSettings = async (thresholdDays: number, defaultCurrency: CurrencyCode) => {
    const updated = await updateSettings(thresholdDays, defaultCurrency);
    setSettings(updated);
  };

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'All' ||
    filters.category !== 'All' ||
    filters.provider !== '' ||
    filters.onlyNeedsFollowUp;

  const breadcrumbLabel =
    activeSection === 'settings'
      ? 'Follow-Up Rules'
      : activeSection === 'needs_followup'
      ? 'Needs Follow-Up'
      : activeSection === 'refunded'
      ? 'Refunded Archive'
      : 'Cancellation Ledger';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        summary={summary}
        thresholdDays={settings.staleThresholdDays}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, 1 primary CTA on right */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                Workspace
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {breadcrumbLabel}
              </span>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>New Cancellation</span>
          </button>
        </header>

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {apiError && (
            <div
              role="alert"
              className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4 text-sm text-red-900"
            >
              <span>{apiError}</span>
              <button
                type="button"
                onClick={loadData}
                className="px-3 py-1 text-xs font-medium text-red-800 bg-white border border-red-200 rounded-md hover:bg-red-50 whitespace-nowrap shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {bannerMessage && (
            <div
              role="status"
              className="px-4 py-3 bg-slate-900 text-white rounded-lg flex items-center justify-between gap-4 text-xs font-medium"
            >
              <span>{bannerMessage}</span>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                aria-label="Dismiss notification"
                className="text-slate-300 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {activeSection === 'settings' ? (
            <SettingsView
              settings={settings}
              records={records}
              onSaveSettings={handleSaveSettings}
              onViewOverdue={() => handleSelectSection('needs_followup')}
            />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                    {activeSection === 'needs_followup'
                      ? 'Overdue Refund Follow-Ups'
                      : activeSection === 'refunded'
                      ? 'Completed Refund Archive'
                      : 'Booking Cancellations & Refunds'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeSection === 'needs_followup'
                      ? `Showing active cancellations unupdated for more than ${settings.staleThresholdDays} ${
                          settings.staleThresholdDays === 1 ? 'day' : 'days'
                        }.`
                      : 'Track cancellation reference numbers, refund statuses, and stalled merchant follow-ups in one ledger.'}
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                  Showing {visibleRecords.length} of {records.length}
                </p>
              </div>

              <SummaryStrip
                summary={summary}
                thresholdDays={settings.staleThresholdDays}
                onlyNeedsFollowUp={filters.onlyNeedsFollowUp}
                onToggleNeedsFollowUp={() =>
                  handleFilterChange({ onlyNeedsFollowUp: !filters.onlyNeedsFollowUp })
                }
              />

              <FilterToolbar
                filters={filters}
                providers={providers}
                staleCount={summary.staleCount}
                thresholdDays={settings.staleThresholdDays}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                onOpenSettings={() => setActiveSection('settings')}
              />

              <CancellationTable
                records={visibleRecords}
                thresholdDays={settings.staleThresholdDays}
                loading={loading}
                hasActiveFilters={hasActiveFilters}
                onSelectRecord={(rec) => {
                  setDrawerFocusFollowUp(false);
                  setSelectedRecordId(rec.id);
                }}
                onQuickFollowUp={(rec) => {
                  setDrawerFocusFollowUp(true);
                  setSelectedRecordId(rec.id);
                }}
                onEditRecord={handleOpenEdit}
                onDeleteRecord={(rec) => setRecordPendingDelete(rec)}
                onClearFilters={handleResetFilters}
                onCreateNew={handleOpenCreate}
              />
            </>
          )}
        </main>
      </div>

      <CancellationModal
        open={modalOpen}
        editingRecord={editingRecord}
        defaultCurrency={settings.defaultCurrency}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCancellation}
      />

      <DetailDrawer
        record={selectedRecord}
        thresholdDays={settings.staleThresholdDays}
        focusFollowUp={drawerFocusFollowUp}
        onClose={() => setSelectedRecordId(null)}
        onLogFollowUp={handleLogFollowUp}
        onEdit={handleOpenEdit}
        onDelete={(rec) => setRecordPendingDelete(rec)}
      />

      <DeleteConfirmModal
        record={recordPendingDelete}
        deleting={deleting}
        onCancel={() => setRecordPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default App;
