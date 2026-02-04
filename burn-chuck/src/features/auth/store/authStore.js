import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Auth store: token + user info persisted to localStorage
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      // Decode JWT and populate user fields when setting token
      setToken: (token) => {
        const raw = typeof token === 'string' ? token : '';
        const stripped = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

        // helper: decode base64url JWT payload
        function decodeJwtPayload(t) {
          try {
            const parts = t.split('.');
            if (parts.length < 2) return null;
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(function (c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
            );
            return JSON.parse(jsonPayload);
          } catch (e) {
            return null;
          }
        }

        const payload = decodeJwtPayload(stripped);

        // map common claim names to our user object
        // Backend generates token with claims: id, email, nickname, role
        const user = payload
          ? {
              id: payload.id,
              email: payload.email,
              nickname: payload.nickname,
              roleString: payload.role,
            }
          : null;

        set({ token: raw, user });
      },
      setUser: (user) => set({ user }),
      setRefreshToken: (rt) => set({ refreshToken: rt }),
      setTokens: (token, refreshToken) => {
        // convenience to set both
        if (token) {
          get().setToken(token);
        }
        if (refreshToken) set({ refreshToken });
      },
      logout: () => set({ token: null, refreshToken: null, user: null }),
      // reissue: call refresh endpoint with stored refresh token and update tokens
      reissue: async () => {
        try {
          const rt = get().refreshToken;
          if (!rt) return false;
          const base = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
          const res = await axios.post(`${base}/auth/reissue`, { refreshToken: rt });
          const data = res?.data?.data;
          if (data) {
            const newToken = data.token;
            const newRefresh = data.refreshToken;
            if (newToken) get().setToken(newToken);
            if (newRefresh) set({ refreshToken: newRefresh });
            return true;
          }
          return false;
        } catch (err) {
          console.error('token reissue failed', err);
          // on failure, clear auth
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;
