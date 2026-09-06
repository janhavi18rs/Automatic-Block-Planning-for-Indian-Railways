import { create } from 'zustand';

interface OpsState {
  division: string;
  horizon: 'monthly' | 'weekly';
  wsConnected: boolean;
  theme: 'dark' | 'light';
  mobileMenuOpen: boolean;
  setDivision: (division: string) => void;
  setHorizon: (horizon: 'monthly' | 'weekly') => void;
  setWsConnected: (connected: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  toggleTheme: () => void;
}

export const useOpsStore = create<OpsState>((set) => ({
  division: 'PRYJ',
  horizon: 'weekly',
  wsConnected: false,
  theme: 'dark',
  mobileMenuOpen: false,
  setDivision: (division) => set({ division }),
  setHorizon: (horizon) => set({ horizon }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: next };
  }),
}));
