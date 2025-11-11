import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ELibrary from './pages/ELibrary';
import BookDetail from './pages/BookDetail';
import Printouts from './pages/Printouts';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserRole(parsedUser.role);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole(null);
    setUser(null);
  };

  const getAuthenticatedRedirect = () => {
    if (userRole === 'superadmin') return '/superadmin';
    if (userRole === 'admin') return '/admin';
    return '/dashboard';
  };

  return (
    <Router>
      <Layout isLoggedIn={isLoggedIn} userRole={userRole} user={user} onLogout={handleLogout}>
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? <Navigate to={getAuthenticatedRedirect()} /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to={getAuthenticatedRedirect()} />
              ) : (
                <Login
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                  setUser={setUser}
                />
              )
            }
          />
          <Route
            path="/register"
            element={
              isLoggedIn ? <Navigate to={getAuthenticatedRedirect()} /> : <Register />
            }
          />

          <Route element={<PrivateRoute isLoggedIn={isLoggedIn} userRole={userRole} />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/e-library" element={<ELibrary />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/printouts" element={<Printouts />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<AdminRoute isLoggedIn={isLoggedIn} userRole={userRole} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<SuperAdminRoute isLoggedIn={isLoggedIn} userRole={userRole} />}>
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
