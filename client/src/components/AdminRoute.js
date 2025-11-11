import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function AdminRoute({ isLoggedIn, userRole }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return userRole === 'admin' || userRole === 'superadmin' ? <Outlet /> : <Navigate to="/dashboard" />;
}

export default AdminRoute;
