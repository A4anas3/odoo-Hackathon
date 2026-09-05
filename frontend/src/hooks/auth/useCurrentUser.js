import { useState, useEffect, useCallback } from 'react';
import { AUTH_STORAGE_KEY, USER_STORAGE_KEY, REFRESH_STORAGE_KEY } from '../../config/api';
import { ROLES, hasRequiredRole } from '../../config/permissions';

/**
 * Parses JWT token payload without external library.
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function useCurrentUser() {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    const currentToken = localStorage.getItem(AUTH_STORAGE_KEY);
    if (currentToken) {
      const payload = parseJwt(currentToken);
      if (payload) {
        return {
          userId: payload.sub,
          email: payload.email,
          roles: payload.roles || [ROLES.USER],
        };
      }
    }
    return null;
  });

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('hrms:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('hrms:auth-expired', handleAuthExpired);
  }, []);

  const login = useCallback((tokenResponse, userData = null) => {
    const accessToken = tokenResponse.accessToken || tokenResponse;
    const refreshToken = tokenResponse.refreshToken;

    localStorage.setItem(AUTH_STORAGE_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
    }

    let resolvedUser = userData;
    if (!resolvedUser) {
      const payload = parseJwt(accessToken);
      if (payload) {
        resolvedUser = {
          userId: payload.sub,
          email: payload.email,
          roles: payload.roles || [ROLES.USER],
        };
      }
    }

    if (resolvedUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(resolvedUser));
      setUser(resolvedUser);
    }
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const can = useCallback((requiredRoles) => {
    return hasRequiredRole(user?.roles || [], requiredRoles);
  }, [user]);

  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
    roles: user?.roles || [],
    can,
    login,
    logout,
  };
}
