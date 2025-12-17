import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminExercises from './pages/AdminExercises';
import AdminPlans from './pages/AdminPlans';
import AdminRecommendations from './pages/AdminRecommendations';

const AdminApp = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="exercises" element={<AdminExercises />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="recommendations" element={<AdminRecommendations />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;




