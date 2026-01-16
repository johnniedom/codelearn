import { create } from 'zustand';

/**
 * CMS Store
 *
 * Manages CMS-specific state including current editing state, save status,
 * and UI preferences for the content management system.
 *
 * This store is intentionally NOT persisted as CMS state is session-specific
 * and should reset when the user leaves the CMS.
 */

// =============================================================================
// Types
// =============================================================================

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type PublishStatus = 'idle' | 'validating' | 'preparing' | 'publishing' | 'success' | 'error';

interface CMSState {
  // Current editing state
  currentDraftId: string | null;
  hasUnsavedChanges: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;

  // UI state
  sidebarCollapsed: boolean;
  previewVisible: boolean;

  // Publish state
  publishStatus: PublishStatus;
  publishProgress: number; // 0-100
  publishError: string | null;
}

interface CMSActions {
  // Draft management
  setCurrentDraft: (id: string | null) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  markSaved: () => void;

  // UI toggles
  toggleSidebar: () => void;
  togglePreview: () => void;

  // Publish actions
  setPublishStatus: (status: PublishStatus) => void;
  setPublishProgress: (progress: number) => void;
  setPublishError: (error: string | null) => void;
  resetPublishState: () => void;

  // Reset state
  reset: () => void;
}

type CMSStore = CMSState & CMSActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: CMSState = {
  currentDraftId: null,
  hasUnsavedChanges: false,
  saveStatus: 'idle',
  lastSavedAt: null,
  sidebarCollapsed: false,
  previewVisible: true,
  publishStatus: 'idle',
  publishProgress: 0,
  publishError: null,
};

// =============================================================================
// Store
// =============================================================================

export const useCMSStore = create<CMSStore>()((set) => ({
  // Initial state spread
  ...initialState,

  // ==========================================================================
  // Draft Management Actions
  // ==========================================================================

  setCurrentDraft: (id) => {
    set({
      currentDraftId: id,
      // Reset editing state when switching drafts
      hasUnsavedChanges: false,
      saveStatus: 'idle',
      lastSavedAt: null,
    });
  },

  setUnsavedChanges: (hasChanges) => {
    set({ hasUnsavedChanges: hasChanges });
  },

  setSaveStatus: (status) => {
    set({ saveStatus: status });
  },

  markSaved: () => {
    set({
      hasUnsavedChanges: false,
      saveStatus: 'saved',
      lastSavedAt: new Date(),
    });
  },

  // ==========================================================================
  // UI Toggle Actions
  // ==========================================================================

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  togglePreview: () => {
    set((state) => ({ previewVisible: !state.previewVisible }));
  },

  // ==========================================================================
  // Publish Actions
  // ==========================================================================

  setPublishStatus: (status) => {
    set({ publishStatus: status });
  },

  setPublishProgress: (progress) => {
    set({ publishProgress: progress });
  },

  setPublishError: (error) => {
    set({ publishError: error });
  },

  resetPublishState: () => {
    set({
      publishStatus: 'idle',
      publishProgress: 0,
      publishError: null,
    });
  },

  // ==========================================================================
  // Reset Action
  // ==========================================================================

  reset: () => {
    set(initialState);
  },
}));

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

/**
 * Select only the save-related state.
 * Use this when you only need to display save status.
 */
export const selectSaveState = (state: CMSStore) => ({
  hasUnsavedChanges: state.hasUnsavedChanges,
  saveStatus: state.saveStatus,
  lastSavedAt: state.lastSavedAt,
});

/**
 * Select only the UI state.
 * Use this when you only need sidebar/preview visibility.
 */
export const selectUIState = (state: CMSStore) => ({
  sidebarCollapsed: state.sidebarCollapsed,
  previewVisible: state.previewVisible,
});

export default useCMSStore;
