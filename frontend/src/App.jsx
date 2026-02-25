import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import StudentLogin from './pages/StudentLogin';
import SubmitWork from './pages/SubmitWork';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDetail from './pages/AdminDetail';
import AdminMaterials from './pages/AdminMaterials';
import StudentMaterials from './pages/StudentMaterials';

function StudentRoute({ children }) {
  const { isAuth, role } = useAuth();
  if (!isAuth || role !== 'student') return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuth, role } = useAuth();
  if (!isAuth || role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Student */}
          <Route path="/login" element={<StudentLogin />} />
          <Route
            path="/enviar"
            element={
              <StudentRoute>
                <SubmitWork />
              </StudentRoute>
            }
          />
          <Route
            path="/materiais"
            element={
              <StudentRoute>
                <StudentMaterials />
              </StudentRoute>
            }
          />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/envios/:id"
            element={
              <AdminRoute>
                <AdminDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/materiais"
            element={
              <AdminRoute>
                <AdminMaterials />
              </AdminRoute>
            }
          />

          {/* Default */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
