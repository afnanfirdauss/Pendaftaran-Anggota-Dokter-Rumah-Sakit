import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pasiens } from './pages/Pasiens';
import { PasienDetail } from './pages/PasienDetail';
import { PendaftaranBaru } from './pages/PendaftaranBaru';
import { Antrean } from './pages/Antrean';
import { PublicDisplay } from './pages/PublicDisplay';
import { PoliklinikList } from './pages/PoliklinikList';
import { DokterList } from './pages/DokterList';
import { JadwalList } from './pages/JadwalList';
import { Laporan } from './pages/Laporan';
import { UsersList } from './pages/UsersList';
import { Role } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

// Protected Route Guard with Role Check
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({
  children,
  roles,
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/display" element={<PublicDisplay />} />

            {/* Protected Routes inside AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/pasiens"
                element={
                  <ProtectedRoute roles={['admin', 'petugas']}>
                    <Pasiens />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pasiens/:id"
                element={
                  <ProtectedRoute roles={['admin', 'petugas']}>
                    <PasienDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pendaftaran-baru"
                element={
                  <ProtectedRoute roles={['admin', 'petugas']}>
                    <PendaftaranBaru />
                  </ProtectedRoute>
                }
              />
              <Route path="/antrean" element={<Antrean />} />
              <Route
                path="/polikliniks"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <PoliklinikList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dokters"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <DokterList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jadwals"
                element={
                  <ProtectedRoute roles={['admin', 'dokter']}>
                    <JadwalList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/laporan"
                element={
                  <ProtectedRoute roles={['admin', 'petugas']}>
                    <Laporan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <UsersList />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
