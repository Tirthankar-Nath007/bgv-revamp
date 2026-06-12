import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '@/components/layout/RootLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import OtpPage from '@/pages/public/OtpPage';
import VerifyPage from '@/pages/verifier/VerifyPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import AppealsPage from '@/pages/admin/AppealsPage';
import AppealDetailPage from '@/pages/admin/AppealDetailPage';
import VerifiersPage from '@/pages/admin/VerifiersPage';
import LogsPage from '@/pages/admin/LogsPage';

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/otp', element: <OtpPage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: '/verify', element: <VerifyPage /> },
        ],
      },
    ],
  },

  // Admin login outside main layout (dark themed full page)
  { path: '/admin/login', element: <AdminLoginPage /> },

  // Admin protected section
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
          { path: '/admin/dashboard', element: <DashboardPage /> },
          { path: '/admin/appeals', element: <AppealsPage /> },
          { path: '/admin/appeals/:appealId', element: <AppealDetailPage /> },
          { path: '/admin/verifiers', element: <VerifiersPage /> },
          { path: '/admin/logs', element: <LogsPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
