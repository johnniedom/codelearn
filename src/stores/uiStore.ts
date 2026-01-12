import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * UI Store
 *
 * Manages UI state including theme, modals, navigation, and toast notifications.
 * Some state is persisted (theme preference), while transient state (modals) is not.
 */

type Theme = 'light' | 'dark' | 'system';

interface ModalState {
  isOpen: boolean;
  type: string | null;
  props: Record<string, unknown>;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

interface UIState {
  // Theme
  theme: Theme;
  resolvedTheme: 'light' | 'dark';

  // Modal management
  modal: ModalState;

  // Toast notifications
  toasts: ToastNotification[];

  // Navigation
  isSidebarOpen: boolean;
  isBottomNavVisible: boolean;

  // Loading overlays
  isGlobalLoading: boolean;
  loadingMessage: string | null;

  // Storage warning
  showStorageWarning: boolean;
  storagePercentUsed: number;
}

interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Modal management
  openModal: (type: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toast notifications
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;

  // Navigation
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setBottomNavVisible: (visible: boolean) => void;

  // Loading overlays
  setGlobalLoading: (isLoading: boolean, message?: string) => void;

  // Storage warning
  setStorageWarning: (show: boolean, percentUsed?: number) => void;
}

type UIStore = UIState & UIActions;

// Helper to detect system theme preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Helper to resolve theme
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

// Generate unique toast ID
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Default toast duration
const DEFAULT_TOAST_DURATION = 5000;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      modal: {
        isOpen: false,
        type: null,
        props: {},
      },

      toasts: [],

      isSidebarOpen: false,
      isBottomNavVisible: true,

      isGlobalLoading: false,
      loadingMessage: null,

      showStorageWarning: false,
      storagePercentUsed: 0,

      // Actions
      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme);
        set({ theme, resolvedTheme });

        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolvedTheme);
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        get().setTheme(newTheme);
      },

      openModal: (type, props = {}) => {
        set({
          modal: {
            isOpen: true,
            type,
            props,
          },
        });
      },

      closeModal: () => {
        set({
          modal: {
            isOpen: false,
            type: null,
            props: {},
          },
        });
      },

      showToast: (toast) => {
        const id = generateToastId();
        const newToast: ToastNotification = {
          ...toast,
          id,
          duration: toast.duration ?? DEFAULT_TOAST_DURATION,
          dismissible: toast.dismissible ?? true,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-dismiss after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().dismissToast(id);
          }, newToast.duration);
        }
      },

      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      clearAllToasts: () => {
        set({ toasts: [] });
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      setSidebarOpen: (isOpen) => {
        set({ isSidebarOpen: isOpen });
      },

      setBottomNavVisible: (visible) => {
        set({ isBottomNavVisible: visible });
      },

      setGlobalLoading: (isLoading, message) => {
        set({
          isGlobalLoading: isLoading,
          loadingMessage: isLoading ? message ?? null : null,
        });
      },

      setStorageWarning: (show, percentUsed) => {
        set({
          showStorageWarning: show,
          storagePercentUsed: percentUsed ?? get().storagePercentUsed,
        });
      },
    }),
    {
      name: 'codelearn-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not transient UI state
      partialize: (state) => ({
        theme: state.theme,
      }),
      // Re-resolve theme on hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.resolvedTheme = resolveTheme(state.theme);

          // Apply theme to document
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(state.resolvedTheme);
          }
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', () => {
    const { theme, setTheme } = useUIStore.getState();
    if (theme === 'system') {
      // Re-resolve system theme
      setTheme('system');
    }
  });
}

export default useUIStore;
