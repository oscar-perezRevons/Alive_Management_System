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

  console.log('[ProtectedRoute] Evaluando acceso:', {
    isAuthenticated,
    userEmail: user?.email,
    userRole: user?.role,
    requiredRole
  });

  if (!isAuthenticated || !user) {
    console.log('Acceso denegado: Usuario no autenticado. Redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    console.log(`Privilegios insuficientes: Se requiere ADMIN pero el usuario es ${user.role}. Redirigiendo a /unauthorized`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log(`Acceso concedido de forma segura para el rol: ${user.role}`);
  return <>{children}</>;
};