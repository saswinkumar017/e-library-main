import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function PrivateRoute({ isLoggedIn }) {
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;
