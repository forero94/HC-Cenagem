// ===============================
// src/App.jsx  (root: AuthGate + rutas)
// ===============================
import React, { useState } from 'react';
import AuthGate from './modules/auth/AuthGate';
import LoginView from './modules/auth/LoginView';
import { getUser, logout } from './modules/auth/useAuth';
import AppRoutes from './routes/AppRoutes';
export default function App(){
  const [user, setUser] = useState(getUser());
  return (
    <AuthGate fallback={<LoginView onLogin={(u)=>setUser(u)} /> }>
      <AppRoutes user={user} onLogout={()=>{ logout(); setUser(null); }} />
    </AuthGate>
  );
}
