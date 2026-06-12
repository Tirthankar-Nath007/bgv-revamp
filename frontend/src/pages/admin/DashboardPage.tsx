import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, downloadExport, downloadAppealsExport, downloadVerifiersExport } from '@/features/admin/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertTriangle, XCircle, Users, FileText, ShieldCheck, Download } from 'lucide-react';
import { formatDateTime } from '@/utils/date';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { useState } from 'react';

function StatCard({
  title, value, icon: Icon, color, onExport, exporting,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  onExport?: () => void;
  exporting?: boolean;
}) {
  return (
    <div className="card p-5 flex items-center gap-4 relative">
      <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
      {onExport && (
        <button
          onClick={onExport}
          disabled={exporting}
          title={`Export ${title}`}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
        >
          {exporting ? <span className="spinner h-4 w-4" /> : <Download className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return <div className="card p-5 h-24 skeleton" />;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: getDashboardStats });
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const chartData = stats
    ? [
        { name: 'Match', value: stats.matchedVerifications, fill: '#16a34a' },
        { name: 'Partial', value: stats.partialMatches, fill: '#d97706' },
        { name: 'Mismatch', value: stats.mismatches, fill: '#dc2626' },
      ]
    : [];

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const makeExporter = (key: string, fn: () => Promise<Blob>, filename: string) => async () => {
    setExportingKey(key);
    try {
      triggerDownload(await fn(), filename);
    } catch {
      toast.error('Export failed');
    } finally {
      setExportingKey(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of BGV portal activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Verifications" value={stats?.totalVerifications ?? 0}
              icon={ShieldCheck} color="bg-blue-100 text-blue-600"
              onExport={makeExporter('verifications', downloadExport, `bgv-verifications-${today}.xlsx`)}
              exporting={exportingKey === 'verifications'}
            />
            <StatCard
              title="Pending Appeals" value={stats?.pendingAppeals ?? 0}
              icon={FileText} color="bg-amber-100 text-amber-600"
              onExport={makeExporter('pending-appeals', () => downloadAppealsExport('pending'), `bgv-appeals-pending-${today}.xlsx`)}
              exporting={exportingKey === 'pending-appeals'}
            />
            <StatCard
              title="Active Verifiers" value={stats?.activeVerifiers ?? 0}
              icon={Users} color="bg-green-100 text-green-600"
              onExport={makeExporter('verifiers', downloadVerifiersExport, `bgv-verifiers-${today}.xlsx`)}
              exporting={exportingKey === 'verifiers'}
            />
            <StatCard
              title="Completed Appeals" value={stats?.completedAppeals ?? 0}
              icon={CheckCircle} color="bg-purple-100 text-purple-600"
              onExport={makeExporter('completed-appeals', () => downloadAppealsExport('completed'), `bgv-appeals-completed-${today}.xlsx`)}
              exporting={exportingKey === 'completed-appeals'}
            />
          </>
        )}
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification status chart */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Verification Results Breakdown</h2>
          {isLoading ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Count']} />
                <Bar dataKey="value" fill="#007A3D" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Match/Mismatch quick stats */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Result Summary</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 skeleton rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Full Match', value: stats?.matchedVerifications ?? 0, icon: CheckCircle, cls: 'text-green-600 bg-green-50' },
                { label: 'Partial Match', value: stats?.partialMatches ?? 0, icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
                { label: 'Mismatch', value: stats?.mismatches ?? 0, icon: XCircle, cls: 'text-red-600 bg-red-50' },
              ].map(({ label, value, icon: Icon, cls }) => (
                <div key={label} className={clsx('flex items-center justify-between rounded-lg p-3', cls)}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-lg font-bold">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityList title="Recent Verifications" items={stats?.recentVerifications} loading={isLoading} />
        <ActivityList title="Recent Appeals" items={stats?.recentAppeals} loading={isLoading} />
      </div>
    </div>
  );
}

function ActivityList({ title, items, loading }: { title: string; items?: { id: string; employeeId: string; status: string; timestamp: string }[]; loading: boolean }) {
  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 skeleton rounded-lg" />)}
        </div>
      ) : !items?.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">#{item.id}</p>
                <p className="text-xs text-gray-500">EMP: {item.employeeId}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={item.status} />
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(item.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'MATCH') return <span className="badge-success">Match</span>;
  if (s === 'PARTIAL_MATCH') return <span className="badge-warning">Partial</span>;
  if (s === 'MISMATCH') return <span className="badge-danger">Mismatch</span>;
  if (s === 'PENDING') return <span className="badge-warning">Pending</span>;
  if (s === 'APPROVED') return <span className="badge-success">Approved</span>;
  if (s === 'REJECTED') return <span className="badge-danger">Rejected</span>;
  return <span className="badge-gray">{status}</span>;
}
