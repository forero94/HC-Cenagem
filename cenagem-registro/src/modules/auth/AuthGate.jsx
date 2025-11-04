import React, { useEffect, useRef, useState } from 'react';
import { getUser, loginWithUploadTicket, logout } from './useAuth';

const extractTicketFromLocation = () => {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has('ticket')) {
    return searchParams.get('ticket');
  }
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }
  const query = hash.slice(queryIndex + 1);
  const params = new URLSearchParams(query);
  return params.get('ticket');
};

const clearTicketFromLocation = () => {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  const searchParams = new URLSearchParams(search);
  searchParams.delete('ticket');

  let newHash = hash;
  if (hash.includes('?')) {
    const [base, query] = hash.split('?');
    const hashParams = new URLSearchParams(query);
    hashParams.delete('ticket');
    const nextQuery = hashParams.toString();
    newHash = nextQuery ? `${base}?${nextQuery}` : base;
  }

  const nextSearch = searchParams.toString();
  const nextUrl = `${pathname}${nextSearch ? `?${nextSearch}` : ''}${newHash}`;
  window.history.replaceState({}, '', nextUrl);
};

export default function AuthGate({
  children,
  fallback = null,
}) {
  const [user, setUser] = useState(() => getUser());
  const [resolvingTicket, setResolvingTicket] = useState(false);
  const attemptedTicketRef = useRef(false);

  const handleLogout = async () => {
    setUser(null);
    await logout();
  };

  useEffect(() => {
    if (user) {
      attemptedTicketRef.current = false;
      return;
    }

    const ticket = extractTicketFromLocation();

    if (!ticket) {
      attemptedTicketRef.current = false;
      return;
    }

    if (resolvingTicket || attemptedTicketRef.current) {
      return;
    }

    attemptedTicketRef.current = true;
    setResolvingTicket(true);

    (async () => {
      try {
        const { user: ticketUser } = await loginWithUploadTicket(ticket);
        clearTicketFromLocation();
        setUser(ticketUser);
      } catch (error) {
        console.warn('[auth] No se pudo iniciar sesión con el ticket', error);
        clearTicketFromLocation();
      } finally {
        setResolvingTicket(false);
      }
    })();
  }, [resolvingTicket, user]);

  const handleLogin = (nextUser) => {
    if (nextUser) {
      setUser(nextUser);
    }
  };

  if (!user) {
    if (React.isValidElement(fallback)) {
      return React.cloneElement(fallback, { onLogin: handleLogin });
    }
    return fallback;
  }

  return children({ user, onLogout: handleLogout });
}
