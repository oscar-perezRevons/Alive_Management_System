import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// IMPORTACIÓN DE COMPONENTES ESTRUCTURALES Y LOGIN
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// IMPORTACIÓN DE PÁGINAS EXISTENTES
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { GroupsPage } from './pages/GroupsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { SecretariaPage } from './pages/SecretariaPage';

// IMPORTACIÓN DE LAS NUEVAS PÁGINAS CREADAS SIMÉTRICAS AL SIDEBAR
import { PuntuacionesPage } from './pages/PuntuacionesPage';
import { ProgramaPage } from './pages/ProgramaPage';
import { EventosPage } from './pages/EventosPage';
import { MaterialesPage } from './pages/MaterialesPage';

function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas de Control de Acceso */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* RUTAS PROTEGIDAS BAJO EL COMPONENTE LAYOUT UNIFICADO AL MOCKUP */}
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

        {/* ENLACES DIRECTOS A LOS NUEVOS MÓDULOS DEL SIDEBAR */}
        <Route
          path="/dashboard/secretaria"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SecretariaPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/puntuaciones"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PuntuacionesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/programa"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProgramaPage />
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
          path="/dashboard/materiales"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MaterialesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Comportamiento de redirecciones automáticas por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;