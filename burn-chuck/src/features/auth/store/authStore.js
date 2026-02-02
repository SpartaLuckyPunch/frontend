import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store: token + user info persisted to localStorage
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
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
