import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function PrivateRoute({ isLoggedIn, userRole }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (userRole === 'superadmin') {
    return <Navigate to="/superadmin" />;
  }

  if (userRole === 'admin') {
    return <Navigate to="/admin" />;
  }

  return <Outlet />;
}

export default PrivateRoute;
