// ===============================
// src/App.jsx  (root: AuthGate + rutas)
// ===============================
import React, { useState } from 'react';
import AuthGate from './modules/auth/AuthGate';
import LoginView from './modules/auth/LoginView';
import { getUser, logout } from './modules/auth/useAuth';
import AppRoutes from './routes/AppRoutes';
export default function App(){
  return (
    <AuthGate
      fallback={<LoginView />}
    >
      {({ user, onLogout }) => (
        <AppRoutes
          user={user}
          onLogout={onLogout}
        />
      )}
    </AuthGate>
  );
}
