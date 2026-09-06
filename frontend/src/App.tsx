import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ControlRoomLayout } from './layouts/ControlRoomLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CorridorMap } from './pages/CorridorMap';
import { ScheduleView } from './pages/ScheduleView';
import { Conflicts } from './pages/Conflicts';
import { FieldOps } from './pages/FieldOps';
import { Analytics } from './pages/Analytics';
import { DataSources } from './pages/DataSources';
import { BDMSWorkflow } from './pages/BDMSWorkflow';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes inside ControlRoomLayout */}
        <Route
          element={
            <ProtectedRoute>
              <ControlRoomLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<CorridorMap />} />
          <Route path="/schedule" element={<ScheduleView />} />
          <Route path="/conflicts" element={<Conflicts />} />
          <Route path="/bdms" element={<BDMSWorkflow />} />
          <Route path="/field" element={<FieldOps />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/data-sources" element={<DataSources />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
