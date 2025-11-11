import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function AdminRoute({ isLoggedIn, userRole }) {
  return isLoggedIn && userRole === 'admin' ? <Outlet /> : <Navigate to="/dashboard" />;
}

export default AdminRoute;
