import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, token } = useAuthStore();

  const deFactoAuthenticated = isAuthenticated || !!token;

  console.log('[ProtectedRoute] Evaluando acceso:', { 
    isAuthenticated: deFactoAuthenticated, 
    userEmail: user?.email, 
    userRole: user?.role, 
    requiredRole 
  });

  if (!deFactoAuthenticated) {
    console.log('Acceso denegado: Usuario no autenticado. Redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log(`Acceso denegado: Se requiere rol ${requiredRole}. Redirigiendo a /unauthorized`);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};