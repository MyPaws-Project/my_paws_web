import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: 16 }}>Cargando…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
