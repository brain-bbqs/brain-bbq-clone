import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // adjust path to your actual AuthContext location

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation(); 

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If the user is null (not signed in), force a redirect to /auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}