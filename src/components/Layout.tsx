import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { clearUserFromStorage } from '../services/auth';

function Layout() {
  const handleLogout = () => {
    clearUserFromStorage();
    window.location.href = "/login";
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <Outlet />
    </>
  );
}

export default Layout; 