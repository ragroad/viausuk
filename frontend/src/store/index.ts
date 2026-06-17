import { create } from 'zustand';
import { Organisation, User } from '../types';

interface AuthState {
  user:    User | null;
  org:     Organisation | null;
  role:    string | null;
  getToken?: () => Promise<string | null>;
  setAuth: (user: User, org: Organisation, role: string) => void;
  setGetToken: (fn: () => Promise<string | null>) => void;
  clear:   () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:     null,
  org:      null,
  role:     null,
  getToken: undefined,
  setAuth:  (user, org, role) => set({ user, org, role }),
  setGetToken: (fn) => set({ getToken: fn }),
  clear:    () => set({ user: null, org: null, role: null }),
}));

interface UIState {
  screen:    string;
  setScreen: (s: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  screen:      'dashboard',
  setScreen:   (screen) => set({ screen }),
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
