import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from './AppShell';
export function ProtectedShell() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink-muted)] text-sm">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}
