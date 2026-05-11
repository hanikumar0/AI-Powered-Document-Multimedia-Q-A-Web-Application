import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: Cookies.get('auth-token') || null,
      isLoading: false,
      setAuth: (user, token) => {
        Cookies.set('auth-token', token, { expires: 7, secure: true, sameSite: 'strict' });
        set({ user, token });
      },
      logout: () => {
        Cookies.remove('auth-token');
        set({ user: null, token: null });
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user object in localStorage, token is in Cookies
    }
  )
);
