import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  function handleLogin(tok) {
    localStorage.setItem('token', tok);
    setToken(tok);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!token ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}