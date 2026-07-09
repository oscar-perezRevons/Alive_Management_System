import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { GroupsPage } from './pages/GroupsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { SecretariaPage } from './pages/SecretariaPage';
import { PuntuacionesPage } from './pages/PuntuacionesPage';
import { ProgramaPage } from './pages/ProgramaPage';
import { EventosPage } from './pages/EventosPage';
import { MaterialesPage } from './pages/MaterialesPage';
import { MatinalesPage } from './pages/MatinalesPage'; 
import { RankingPage } from './pages/RankingPage'; 
import { ProfilePage } from './pages/ProfilePage';

function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> 
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
            <ProtectedRoute allowedAccessRoles={['ADMIN']}>
              <DashboardLayout>
                <GroupsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/activities"
          element={
            <ProtectedRoute allowedAccessRoles={['ADMIN']}>
              <DashboardLayout>
                <ActivitiesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/secretaria"
          element={
            <ProtectedRoute allowedAccessRoles={['ADMIN', 'LIDER_GP']}>
              <DashboardLayout>
                <SecretariaPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/puntuaciones"
          element={
            <ProtectedRoute allowedAccessRoles={['ADMIN']}>
              <DashboardLayout>
                <PuntuacionesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/programa"
          element={
            <ProtectedRoute allowedAccessRoles={['ADMIN', 'LIDER_GP']}>
              <DashboardLayout>
                <ProgramaPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/matinales"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MatinalesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/eventos"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EventosPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ranking"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RankingPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/materiales"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MaterialesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProfilePage />
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