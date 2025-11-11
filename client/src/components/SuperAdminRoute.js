import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function SuperAdminRoute({ isLoggedIn, userRole }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return userRole === 'superadmin' ? <Outlet /> : <Navigate to="/dashboard" />;
}

export default SuperAdminRoute;
