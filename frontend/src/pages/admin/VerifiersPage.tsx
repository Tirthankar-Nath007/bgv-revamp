import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVerifiers, getBlockedVerifiers, toggleVerifier, unblockAttempt } from '@/features/admin/adminApi';
import type { BlockedVerifier } from '@/features/admin/adminApi';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/date';
import { ToggleLeft, ToggleRight, ShieldOff, ShieldCheck, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { TablePagination } from '@/components/ui/table-pagination';

const PAGE_SIZE = 20;

type Tab = 'all' | 'blocked';

function UnblockModal({ item, onClose, onConfirm, loading }: {
  item: BlockedVerifier;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Unblock Verifier</h2>
            <p className="text-xs text-gray-500">Reset attempt count to zero</p>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm space-y-1">
          <p><span className="text-gray-500">Verifier:</span> <span className="font-medium">{item.verifierCompanyName}</span></p>
          <p><span className="text-gray-500">Email:</span> {item.verifierEmail}</p>
          <p><span className="text-gray-500">Employee ID:</span> <span className="font-mono">{item.employeeId}</span></p>
          <p><span className="text-gray-500">Attempts:</span> <span className="text-red-600 font-medium">{item.attemptCount}</span></p>
        </div>
        <p className="text-sm text-gray-600">
          This will reset the attempt count and allow the verifier to retry this employee lookup.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700">
            {loading ? <span className="spinner" /> : 'Confirm Unblock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifiersPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [unblockTarget, setUnblockTarget] = useState<BlockedVerifier | null>(null);
  const [allPage, setAllPage] = useState(0);
  const [blockedPage, setBlockedPage] = useState(0);

  const { data: verifiers, isLoading: vLoading } = useQuery({
    queryKey: ['admin-verifiers'],
    queryFn: getVerifiers,
  });

  const { data: blocked, isLoading: bLoading } = useQuery({
    queryKey: ['blocked-verifiers'],
    queryFn: getBlockedVerifiers,
  });

  const { mutate: toggle, isPending: toggling } = useMutation({
    mutationFn: (id: number) => toggleVerifier(id),
    onSuccess: () => {
      toast.success('Verifier status updated');
      qc.invalidateQueries({ queryKey: ['admin-verifiers'] });
    },
    onError: () => toast.error('Failed to update verifier'),
  });

  const { mutate: doUnblock, isPending: unblocking } = useMutation({
    mutationFn: (attemptId: number) => unblockAttempt(attemptId),
    onSuccess: () => {
      toast.success('Verifier unblocked successfully');
      setUnblockTarget(null);
      qc.invalidateQueries({ queryKey: ['blocked-verifiers'] });
    },
    onError: () => toast.error('Failed to unblock verifier'),
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearch('');
    setAllPage(0);
    setBlockedPage(0);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (activeTab === 'all') setAllPage(0);
    else setBlockedPage(0);
  };

  const filteredVerifiers = useMemo(() => {
    if (!verifiers) return [];
    if (!search.trim()) return verifiers;
    const q = search.trim().toLowerCase();
    return verifiers.filter((v) =>
      v.companyName.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    );
  }, [verifiers, search]);

  const filteredBlocked = useMemo(() => {
    if (!blocked) return [];
    if (!search.trim()) return blocked;
    const q = search.trim().toLowerCase();
    return blocked.filter((b) =>
      b.verifierCompanyName.toLowerCase().includes(q) ||
      b.verifierEmail.toLowerCase().includes(q) ||
      b.employeeId.toLowerCase().includes(q) ||
      b.employeeName.toLowerCase().includes(q)
    );
  }, [blocked, search]);

  const allTotalPages = Math.ceil(filteredVerifiers.length / PAGE_SIZE);
  const allSlice = filteredVerifiers.slice(allPage * PAGE_SIZE, (allPage + 1) * PAGE_SIZE);

  const blockedTotalPages = Math.ceil(filteredBlocked.length / PAGE_SIZE);
  const blockedSlice = filteredBlocked.slice(blockedPage * PAGE_SIZE, (blockedPage + 1) * PAGE_SIZE);

  const isLoading = activeTab === 'all' ? vLoading : bLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifiers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage registered BGV verifier accounts</p>
      </div>

      <div className="card overflow-hidden">
        {/* Tab header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-3 pb-0 border-b border-gray-100">
          <div className="flex gap-1">
            <button
              onClick={() => handleTabChange('all')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
                activeTab === 'all'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              All Verifiers
              {verifiers && (
                <span className={clsx(
                  'ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  activeTab === 'all' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                )}>
                  {verifiers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('blocked')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
                activeTab === 'blocked'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="flex items-center gap-1.5">
                <ShieldOff className="h-3.5 w-3.5" />
                Blocked
                {blocked && (
                  <span className={clsx(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    activeTab === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  )}>
                    {blocked.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'all' ? 'Search by name or email…' : 'Search blocked verifiers…'}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="field-input pl-8 py-1.5 text-sm"
            />
            {search && (
              <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table content */}
        {isLoading ? (
          <div className="divide-y p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
          </div>
        ) : activeTab === 'all' ? (
          <>
            {!allSlice.length ? (
              <p className="text-center py-10 text-gray-400 text-sm">
                {search ? 'No verifiers match your search' : 'No verifiers registered'}
              </p>
            ) : (
              <>
                {/* Desktop */}
                <table className="hidden w-full sm:table">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allSlice.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.companyName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{v.email}</td>
                        <td className="px-4 py-3">
                          {v.isBgvAgency
                            ? <span className="badge-info">BGV Agency</span>
                            : <span className="badge-gray">Direct</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(v.lastLoginAt)}</td>
                        <td className="px-4 py-3">
                          {v.isActive
                            ? <span className="badge-success">Active</span>
                            : <span className="badge-danger">Inactive</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggle(v.id)}
                            disabled={toggling}
                            className={clsx('btn-ghost p-1.5', v.isActive ? 'text-green-600' : 'text-gray-400')}
                            title={v.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {v.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile */}
                <div className="divide-y divide-gray-100 sm:hidden">
                  {allSlice.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{v.companyName}</p>
                        <p className="text-xs text-gray-500 truncate">{v.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {v.isActive ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}
                        <button onClick={() => toggle(v.id)} disabled={toggling} className={clsx('p-1', v.isActive ? 'text-green-600' : 'text-gray-400')}>
                          {v.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {allTotalPages > 1 && (
                  <div className="border-t border-gray-100 px-4">
                    <TablePagination page={allPage} totalPages={allTotalPages} onPageChange={setAllPage} />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {!blockedSlice.length ? (
              <p className="text-center py-8 text-gray-400 text-sm">
                {search ? 'No results match your search' : 'No blocked verifiers'}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Verifier</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Employee ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Employee Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Attempts</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Blocked At</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {blockedSlice.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{b.verifierCompanyName}</p>
                            <p className="text-xs text-gray-500">{b.verifierEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">{b.employeeId}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{b.employeeName}</td>
                          <td className="px-4 py-3"><span className="badge-danger">{b.attemptCount} attempts</span></td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(b.blockedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setUnblockTarget(b)}
                              className="btn-ghost text-xs text-amber-700 border border-amber-300 hover:bg-amber-50 px-2.5 py-1.5"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Unblock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {blockedTotalPages > 1 && (
                  <div className="border-t border-gray-100 px-4">
                    <TablePagination page={blockedPage} totalPages={blockedTotalPages} onPageChange={setBlockedPage} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {unblockTarget && (
        <UnblockModal
          item={unblockTarget}
          onClose={() => setUnblockTarget(null)}
          onConfirm={() => doUnblock(unblockTarget.id)}
          loading={unblocking}
        />
      )}
    </div>
  );
}
