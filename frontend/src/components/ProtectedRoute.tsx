import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  console.log('🔐 ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('🔐 ProtectedRoute - user:', user);
  console.log('🔐 ProtectedRoute - requiredRole:', requiredRole);

  // Si no está autenticado
  if (!isAuthenticated || !user) {
    console.log('❌ No autenticado - redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  // Si requiere rol específico y no lo tiene
  if (requiredRole && user.role !== requiredRole) {
    console.log('❌ Rol insuficiente:', user.role, 'requerido:', requiredRole);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Acceso permitido');
  return <>{children}</>;
};