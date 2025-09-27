import React from 'react';
import { getUser } from './useAuth';
export default function AuthGate({children, fallback}){
  const user = getUser();
  if (!user) return fallback || null; return children;
}