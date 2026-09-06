import { create } from 'zustand';

export interface UserProfile {
  id: number;
  email: string;
  role: 'control_office' | 'field_crew' | 'admin';
  full_name: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
