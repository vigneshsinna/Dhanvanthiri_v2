import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/lib/utils/hooks';

interface Props {
  children: JSX.Element;
}

export function PrivateRoute({ children }: Props) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
