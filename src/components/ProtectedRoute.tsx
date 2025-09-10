import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import NotFound from '@/pages/NotFound';
import { Loader2 } from 'lucide-react'; // For a loading indicator

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth(); // <-- Get isLoading state

  // --- NEW: Wait for authentication check to complete ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // If the check is done and the user is NOT logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    // If the route is for admins only and the logged-in user is not an admin, show NotFound
    return <NotFound />;
  }

  // If all checks pass, render the requested component
  return children;
};

export default ProtectedRoute;

