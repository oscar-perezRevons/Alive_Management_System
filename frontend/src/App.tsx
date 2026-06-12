import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { GroupsPage } from './pages/GroupsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardLayout } from './layouts/DashboardLayout';

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  console.log('🔐 ProtectedRoute Check:', {
    isAuthenticated,
    userRole: user?.role,
    requiredRole,
  });

  if (!isAuthenticated || !user) {
    console.log('❌ No autenticado');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log('❌ Rol insuficiente');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Acceso permitido');
  return <>{children}</>;
};

function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    console.log('🔄 App iniciando - Cargando sesión...');
    loadFromStorage();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Dashboard con layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Usuarios - Solo ADMIN */}
        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <UsersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Grupos - Solo ADMIN */}
        <Route
          path="/dashboard/groups"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <GroupsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Actividades - Solo ADMIN */}
        <Route
          path="/dashboard/activities"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardLayout>
                <ActivitiesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirigir por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;