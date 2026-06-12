import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccessLogs } from '@/features/admin/adminApi';
import { formatDateTime } from '@/utils/date';
import { ScrollText, X } from 'lucide-react';
import { clsx } from 'clsx';
import Bowser from 'bowser';
import { TablePagination } from '@/components/ui/table-pagination';

function parseBrowser(ua: string | null | undefined): string {
  if (!ua) return '—';
  try {
    const parsed = Bowser.parse(ua);
    const browser = parsed.browser?.name ?? '';
    const bVersion = parsed.browser?.version ? ` ${parsed.browser.version.split('.')[0]}` : '';
    const os = parsed.os?.name ?? '';
    const parts = [browser + bVersion, os].filter(Boolean);
    return parts.length ? parts.join(' / ') : ua.slice(0, 40);
  } catch {
    return ua.slice(0, 40);
  }
}

function parseMetadata(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const obj = JSON.parse(raw);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  } catch {
    return raw.slice(0, 80);
  }
}

export default function LogsPage() {
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['access-logs', status, role, email, page],
    queryFn: () => getAccessLogs({
      status: status || undefined,
      role: role || undefined,
      email: email.trim() || undefined,
      page,
      size: 25,
    }),
  });

  const clearFilters = () => {
    setStatus('');
    setRole('');
    setEmail('');
    setPage(0);
  };

  const hasFilters = status || role || email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Audit trail of all authentication events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="field-select w-auto min-w-[140px]"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(0); }}
          className="field-select w-auto min-w-[140px]"
        >
          <option value="">All Roles</option>
          <option value="verifier">Verifier</option>
          <option value="admin">Admin</option>
        </select>
        <div className="relative">
          <input
            type="text"
            placeholder="Search email…"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setPage(0); }}
            className="field-input w-56 pr-8"
          />
          {email && (
            <button onClick={() => { setEmail(''); setPage(0); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost text-sm text-gray-500">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 skeleton m-4 rounded-lg" />)}
          </div>
        ) : !data?.content.length ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ScrollText className="h-10 w-10 mb-3" />
            <p className="font-medium">No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Browser / OS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Metadata</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.content.map((log) => (
                  <tr key={log.id} className={clsx('hover:bg-gray-50', log.status === 'FAILURE' && 'bg-red-50/40')}>
                    <td className="px-4 py-2.5 text-sm text-gray-900 max-w-[180px] truncate" title={log.email}>
                      {log.email}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-700">{log.action}</td>
                    <td className="px-4 py-2.5 text-sm capitalize text-gray-600">{log.role}</td>
                    <td className="px-4 py-2.5">
                      <div>
                        {log.status === 'SUCCESS'
                          ? <span className="badge-success">Success</span>
                          : <span className="badge-danger">Failed</span>}
                        {log.failureReason && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-[140px] truncate" title={log.failureReason}>
                            {log.failureReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-500 whitespace-nowrap">{log.ipAddress}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[180px]" title={log.userAgent ?? undefined}>
                      {parseBrowser(log.userAgent)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[200px] truncate" title={log.metadata ?? undefined}>
                      {parseMetadata(log.metadata)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.totalElements} log{data.totalElements !== 1 ? 's' : ''} · Page {data.number + 1} of {data.totalPages}
          </p>
          <TablePagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
