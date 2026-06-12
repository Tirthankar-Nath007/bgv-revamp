import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { revokeToken } from '@/features/auth/authApi';
import { TvsCreditLogo } from '@/components/ui/tvs-credit-logo';

export default function Header() {
  const { isAuthenticated, isVerifier, verifier } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await revokeToken();
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center">
          <TvsCreditLogo variant="dark" showSubtitle subtitle="BGV Portal" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 sm:flex">
          {isAuthenticated && isVerifier && (
            <>
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <User className="h-4 w-4" />
                {verifier?.companyName}
              </span>
              <Link to="/verify" className="text-sm font-medium text-gray-700 hover:text-primary">
                Verify
              </Link>
              <button onClick={handleLogout} className="btn-ghost py-2 px-3 text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}
          {!isAuthenticated && (
            <>
              <Link to="/login" className="btn-secondary py-2">Sign in</Link>
              <Link to="/" className="btn-primary py-2">Register</Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 sm:hidden">
          {isAuthenticated && isVerifier && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">{verifier?.companyName}</p>
              <Link to="/verify" className="block text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>
                Verify
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
          {!isAuthenticated && (
            <div className="flex flex-col gap-2">
              <Link to="/login" className="btn-secondary" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link to="/" className="btn-primary" onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
