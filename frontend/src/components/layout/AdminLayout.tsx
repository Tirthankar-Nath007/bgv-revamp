import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  LayoutDashboard, FileText, Users, ScrollText,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { TvsCreditLogo } from '@/components/ui/tvs-credit-logo';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { revokeToken } from '@/features/auth/authApi';
import SessionWarningModal from '@/components/SessionWarningModal';
import { clsx } from 'clsx';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/appeals', label: 'Appeals', icon: FileText },
  { to: '/admin/verifiers', label: 'Verifiers', icon: Users },
  { to: '/admin/logs', label: 'Access Logs', icon: ScrollText },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { admin } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => navigate('/admin/login');
    window.addEventListener('bgv:unauthorized', handler);
    return () => window.removeEventListener('bgv:unauthorized', handler);
  }, [navigate]);

  const handleLogout = async () => {
    await revokeToken();
    dispatch(logout());
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center px-4 py-5 border-b border-gray-700">
        <TvsCreditLogo variant="light" showSubtitle subtitle="Admin Panel" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-700 px-3 py-4">
        <div className="mb-3 rounded-lg bg-gray-700 px-3 py-2.5">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{admin?.fullName || admin?.username}</p>
          <p className="text-xs text-gray-400 capitalize">{admin?.role?.toLowerCase().replace('_', ' ')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col bg-gray-800 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute left-0 top-0 h-full w-64 bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <TvsCreditLogo variant="dark" logoClassName="h-6" />
          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Modals & Toaster */}
      {sidebarOpen && (
        <button
          className="fixed top-4 left-[17rem] z-50 rounded-full bg-white p-1.5 shadow-lg lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4 text-gray-700" />
        </button>
      )}
      <SessionWarningModal />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
