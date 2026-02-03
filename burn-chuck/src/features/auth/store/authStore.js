import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store: token + user info persisted to localStorage
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
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
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;
