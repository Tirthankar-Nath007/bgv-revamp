import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from './Header';
import Footer from './Footer';
import SessionWarningModal from '@/components/SessionWarningModal';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RootLayout() {
  const navigate = useNavigate();

  // Listen for global 401 events from Axios interceptor
  useEffect(() => {
    const handler = () => navigate('/login');
    window.addEventListener('bgv:unauthorized', handler);
    return () => window.removeEventListener('bgv:unauthorized', handler);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SessionWarningModal />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
