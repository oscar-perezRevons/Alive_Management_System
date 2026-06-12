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
import { ProtectedRoute } from './components/ProtectedRoute'; 

function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    console.log('[App] Inicializando ciclo de vida - Restaurando sesión latente...');
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

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

        <Route
          path="/dashboard/groups"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <GroupsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/activities"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ActivitiesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;