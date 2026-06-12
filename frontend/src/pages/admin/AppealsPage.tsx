import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAppeals } from '@/features/appeals/appealsApi';
import { formatDateTime } from '@/utils/date';
import { clsx } from 'clsx';
import { ChevronRight, Search, MessageSquare } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

// Backend stores status as lowercase: "pending" | "completed"
const STATUS_TABS = ['ALL', 'PENDING', 'COMPLETED'] as const;
type StatusFilter = typeof STATUS_TABS[number];

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'pending') return <span className="badge-danger">Pending</span>;
  if (s === 'completed') return <span className="badge-success">Completed</span>;
  return <span className="badge-gray">{status}</span>;
}

export default function AppealsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['appeals', activeTab, page],
    queryFn: () => getAppeals({
      status: activeTab === 'ALL' ? undefined : activeTab.toLowerCase(),
      page,
      size: 20,
    }),
  });

  // Client-side search across the loaded page
  const filtered = useMemo(() => {
    if (!data?.content || !search.trim()) return data?.content ?? [];
    const q = search.trim().toLowerCase();
    return data.content.filter((a) =>
      a.appealId.toLowerCase().includes(q) ||
      a.employeeId.toLowerCase().includes(q) ||
      (a.employee?.name ?? '').toLowerCase().includes(q) ||
      (a.verifier?.companyName ?? '').toLowerCase().includes(q)
    );
  }, [data?.content, search]);

  const handleTabChange = (tab: StatusFilter) => {
    setActiveTab(tab);
    setPage(0);
    setSearch('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appeals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and respond to verifier queries</p>
      </div>

      {/* Status filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={clsx(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, employee, verifier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 skeleton m-4 rounded-lg" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <MessageSquare className="h-10 w-10 mb-3" />
            <p className="font-medium">No appeals found</p>
            {search && <p className="text-sm mt-1">Try clearing the search filter</p>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Appeal ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Verifier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((appeal) => (
                  <tr
                    key={appeal.id}
                    onClick={() => navigate(`/admin/appeals/${appeal.appealId}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{appeal.appealId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p className="font-medium">{appeal.employee?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 font-mono">{appeal.employeeId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{appeal.verifier?.companyName ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={appeal.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(appeal.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {filtered.map((appeal) => (
                <button
                  key={appeal.id}
                  onClick={() => navigate(`/admin/appeals/${appeal.appealId}`)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-900">{appeal.appealId}</span>
                      <StatusBadge status={appeal.status} />
                    </div>
                    <p className="text-sm text-gray-700 truncate">{appeal.employee?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{appeal.verifier?.companyName} · {formatDateTime(appeal.createdAt)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
            {data && data.totalPages > 1 && (
              <div className="border-t border-gray-100 px-4 flex items-center justify-between">
                <p className="text-xs text-gray-500 py-3">
                  {data.totalElements} appeal{data.totalElements !== 1 ? 's' : ''} · Page {data.number + 1} of {data.totalPages}
                </p>
                <TablePagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
