import { useAuth } from "@/auth";
// import { useToken } from "@/store/authStore";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  isAuthPage?: boolean;
  children: React.ReactNode;
}

export default function ProtectedRoute({
  isAuthPage,
  children,
}: ProtectedRouteProps) {
  const { authenticated } = useAuth()

  if (isAuthPage && authenticated) {
    return <Navigate to="/" replace />;
  }

  if (!authenticated && !isAuthPage) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
