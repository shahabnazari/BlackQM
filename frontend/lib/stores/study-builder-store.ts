import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Type definitions
interface GridColumn {
  value: number;
  label: string;
  customLabel?: string;
  cells: number;
}

interface GridConfiguration {
  rangeMin: number;
  rangeMax: number;
  columns: GridColumn[];
  symmetry: boolean;
  totalCells: number;
  distribution: 'bell' | 'flat' | 'forced';
  instructions?: string;
}

interface Stimulus {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  content: string;
  thumbnail?: string;
  metadata?: {
    duration?: number;
    wordCount?: number;
    dimensions?: { width: number; height: number };
    fileSize?: number;
    mimeType?: string;
  };
  position?: number;
  category?: string;
  tags?: string[];
  uploadStatus: 'pending' | 'processing' | 'complete' | 'failed';
  uploadProgress?: number;
}

interface PreviewSettings {
  device: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  showGrid: boolean;
  showLabels: boolean;
}

interface StudyMetadata {
  id?: string;
  title: string;
  description?: string;
  welcomeMessage?: string;
  consentText?: string;
  logoUrl?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface StudyBuilderState {
  // Study metadata
  studyMetadata: StudyMetadata;
  
  // Grid configuration
  gridConfiguration: GridConfiguration;
  
  // Stimuli
  stimuli: Stimulus[];
  uploadQueue: File[];
  
  // Preview settings
  previewSettings: PreviewSettings;
  
  // UI state
  currentStep: number;
  isDirty: boolean;
  autoSaveStatus: AutoSaveStatus;
  syncStatus: SyncStatus;
  validationErrors: ValidationError[];
  
  // WebSocket state
  isConnected: boolean;
  lastSyncTime?: Date;
  
  // Actions - Study metadata
  setStudyMetadata: (metadata: Partial<StudyMetadata>) => void;
  
  // Actions - Grid configuration
  updateGrid: (config: Partial<GridConfiguration>) => void;
  setGridColumns: (columns: GridColumn[]) => void;
  updateColumnCells: (columnIndex: number, cells: number) => void;
  applyDistribution: (distribution: 'bell' | 'flat' | 'forced') => void;
  
  // Actions - Stimuli
  addStimulus: (stimulus: Stimulus) => void;
  removeStimulus: (id: string) => void;
  updateStimulus: (id: string, updates: Partial<Stimulus>) => void;
  reorderStimuli: (from: number, to: number) => void;
  addToUploadQueue: (files: File[]) => void;
  processUploadQueue: () => Promise<void>;
  
  // Actions - Preview
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  setPreviewZoom: (zoom: number) => void;
  togglePreviewGrid: () => void;
  
  // Actions - State management
  setCurrentStep: (step: number) => void;
  setAutoSaveStatus: (status: AutoSaveStatus) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  validateStudy: () => boolean;
  
  // Actions - Persistence
  saveToServer: () => Promise<void>;
  loadFromServer: (studyId: string) => Promise<void>;
  clearStudy: () => void;
  
  // Actions - WebSocket
  setConnectionStatus: (connected: boolean) => void;
  handleWebSocketMessage: (message: any) => void;
}

// Default values
const defaultGridConfig: GridConfiguration = {
  rangeMin: -3,
  rangeMax: 3,
  columns: [
    { value: -3, label: 'Most Disagree', cells: 1 },
    { value: -2, label: 'Disagree', cells: 2 },
    { value: -1, label: 'Slightly Disagree', cells: 3 },
    { value: 0, label: 'Neutral', cells: 4 },
    { value: 1, label: 'Slightly Agree', cells: 3 },
    { value: 2, label: 'Agree', cells: 2 },
    { value: 3, label: 'Most Agree', cells: 1 }
  ],
  symmetry: true,
  totalCells: 16,
  distribution: 'bell',
  instructions: 'Please sort the statements according to your level of agreement.'
};

const defaultPreviewSettings: PreviewSettings = {
  device: 'desktop',
  zoom: 1,
  showGrid: true,
  showLabels: true
};

// Create the store
export const useStudyBuilderStore = create<StudyBuilderState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      studyMetadata: {
        title: '',
        description: '',
        welcomeMessage: '',
        consentText: ''
      },
      gridConfiguration: defaultGridConfig,
      stimuli: [],
      uploadQueue: [],
      previewSettings: defaultPreviewSettings,
      currentStep: 0,
      isDirty: false,
      autoSaveStatus: 'idle',
      syncStatus: 'idle',
      validationErrors: [],
      isConnected: false,
      
      // Study metadata actions
      setStudyMetadata: (metadata) => set((state) => {
        Object.assign(state.studyMetadata, metadata);
        state.isDirty = true;
      }),
      
      // Grid configuration actions
      updateGrid: (config) => set((state) => {
        Object.assign(state.gridConfiguration, config);
        state.isDirty = true;
      }),
      
      setGridColumns: (columns) => set((state) => {
        state.gridConfiguration.columns = columns;
        state.gridConfiguration.totalCells = columns.reduce((sum, col) => sum + col.cells, 0);
        state.isDirty = true;
      }),
      
      updateColumnCells: (columnIndex, cells) => set((state) => {
        if (state.gridConfiguration.columns[columnIndex]) {
          state.gridConfiguration.columns[columnIndex].cells = cells;
          
          // Update symmetrical column if symmetry is enabled
          if (state.gridConfiguration.symmetry) {
            const mirrorIndex = state.gridConfiguration.columns.length - 1 - columnIndex;
            if (mirrorIndex !== columnIndex && state.gridConfiguration.columns[mirrorIndex]) {
              state.gridConfiguration.columns[mirrorIndex].cells = cells;
            }
          }
          
          // Recalculate total cells
          state.gridConfiguration.totalCells = state.gridConfiguration.columns.reduce(
            (sum, col) => sum + col.cells, 
            0
          );
          state.isDirty = true;
        }
      }),
      
      applyDistribution: (distribution: any) => set((state) => {
        state.gridConfiguration.distribution = distribution;
        // Recalculate cells based on distribution
        // This would call a helper function to generate the appropriate distribution
        state.isDirty = true;
      }),
      
      // Stimuli actions
      addStimulus: (stimulus) => set((state) => {
        state.stimuli.push(stimulus);
        state.isDirty = true;
      }),
      
      removeStimulus: (id) => set((state) => {
        state.stimuli = state.stimuli.filter((s: any) => s.id !== id);
        state.isDirty = true;
      }),
      
      updateStimulus: (id, updates) => set((state) => {
        const index = state.stimuli.findIndex(s => s.id === id);
        if (index !== -1) {
          const stimulus = state.stimuli[index];
          if (stimulus) {
            Object.assign(stimulus, updates);
            state.isDirty = true;
          }
        }
      }),

      reorderStimuli: (from, to) => set((state) => {
        const item = state.stimuli[from];
        if (!item) return;

        state.stimuli.splice(from, 1);
        state.stimuli.splice(to, 0, item);
        state.isDirty = true;
      }),
      
      addToUploadQueue: (files) => set((state) => {
        state.uploadQueue.push(...files);
      }),
      
      processUploadQueue: async () => {
        const { uploadQueue, studyMetadata } = get();
        if (!studyMetadata.id || uploadQueue.length === 0) return;
        
        set((state) => {
          state.autoSaveStatus = 'saving';
        });
        
        try {
          for (const file of uploadQueue) {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`/api/studies/${studyMetadata.id}/stimuli`, {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              const data = await response.json();
              set((state) => {
                state.stimuli.push(data.data);
                state.uploadQueue = state.uploadQueue.filter((f: any) => f !== file);
              });
            }
          }
          
          set((state) => {
            state.autoSaveStatus = 'saved';
          });
        } catch (error: any) {
          console.error('Upload error:', error);
          set((state) => {
            state.autoSaveStatus = 'error';
          });
        }
      },
      
      // Preview actions
      setPreviewDevice: (device) => set((state) => {
        state.previewSettings.device = device;
      }),
      
      setPreviewZoom: (zoom) => set((state) => {
        state.previewSettings.zoom = zoom;
      }),
      
      togglePreviewGrid: () => set((state) => {
        state.previewSettings.showGrid = !state.previewSettings.showGrid;
      }),
      
      // State management actions
      setCurrentStep: (step) => set((state) => {
        state.currentStep = step;
      }),
      
      setAutoSaveStatus: (status) => set((state) => {
        state.autoSaveStatus = status;
      }),
      
      setSyncStatus: (status) => set((state) => {
        state.syncStatus = status;
      }),
      
      setValidationErrors: (errors) => set((state) => {
        state.validationErrors = errors;
      }),
      
      validateStudy: () => {
        const { studyMetadata, gridConfiguration, stimuli } = get();
        const errors: ValidationError[] = [];
        
        // Validate study metadata
        if (!studyMetadata.title) {
          errors.push({ field: 'title', message: 'Study title is required' });
        }
        
        // Validate grid configuration
        if (gridConfiguration.totalCells !== stimuli.length) {
          errors.push({ 
            field: 'stimuli', 
            message: `Number of stimuli (${stimuli.length}) must match grid cells (${gridConfiguration.totalCells})` 
          });
        }
        
        set((state) => {
          state.validationErrors = errors;
        });
        
        return errors.length === 0;
      },
      
      // Persistence actions
      saveToServer: async () => {
        const { studyMetadata, gridConfiguration /* , stimuli */ } = get();
        // stimuli will be used when saving is fully implemented
        
        if (!studyMetadata.id) {
          console.error('No study ID to save');
          return;
        }
        
        set((state) => {
          state.autoSaveStatus = 'saving';
          state.syncStatus = 'syncing';
        });
        
        try {
          // Save grid configuration
          await fetch(`/api/studies/${studyMetadata.id}/grid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gridConfiguration)
          });
          
          // Save study metadata
          await fetch(`/api/studies/${studyMetadata.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studyMetadata)
          });
          
          set((state) => {
            state.isDirty = false;
            state.autoSaveStatus = 'saved';
            state.syncStatus = 'synced';
            state.lastSyncTime = new Date();
          });
        } catch (error: any) {
          console.error('Save error:', error);
          set((state) => {
            state.autoSaveStatus = 'error';
            state.syncStatus = 'error';
          });
        }
      },
      
      loadFromServer: async (studyId) => {
        set((state) => {
          state.syncStatus = 'syncing';
        });
        
        try {
          // Load study metadata
          const studyResponse = await fetch(`/api/studies/${studyId}`);
          const studyData = await studyResponse.json();
          
          // Load grid configuration
          const gridResponse = await fetch(`/api/studies/${studyId}/grid`);
          const gridData = await gridResponse.json();
          
          // Load stimuli
          const stimuliResponse = await fetch(`/api/studies/${studyId}/stimuli`);
          const stimuliData = await stimuliResponse.json();
          
          set((state) => {
            state.studyMetadata = { ...studyData.data, id: studyId };
            state.gridConfiguration = gridData.data;
            state.stimuli = stimuliData.data;
            state.isDirty = false;
            state.syncStatus = 'synced';
            state.lastSyncTime = new Date();
          });
        } catch (error: any) {
          console.error('Load error:', error);
          set((state) => {
            state.syncStatus = 'error';
          });
        }
      },
      
      clearStudy: () => set((state) => {
        state.studyMetadata = { title: '', description: '' };
        state.gridConfiguration = defaultGridConfig;
        state.stimuli = [];
        state.uploadQueue = [];
        state.currentStep = 0;
        state.isDirty = false;
        state.validationErrors = [];
      }),
      
      // WebSocket actions
      setConnectionStatus: (connected) => set((state) => {
        state.isConnected = connected;
      }),
      
      handleWebSocketMessage: (message) => {
        const { type, payload } = message;
        
        switch (type) {
          case 'grid:updated':
            set((state) => {
              state.gridConfiguration = payload;
              state.syncStatus = 'synced';
            });
            break;
            
          case 'stimulus:added':
            set((state) => {
              state.stimuli.push(payload);
            });
            break;
            
          case 'stimulus:removed':
            set((state) => {
              state.stimuli = state.stimuli.filter((s: any) => s.id !== payload.id);
            });
            break;
            
          default:
            console.log('Unknown WebSocket message type:', type);
        }
      }
    })),
    {
      name: 'study-builder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        studyMetadata: state.studyMetadata,
        gridConfiguration: state.gridConfiguration,
        stimuli: state.stimuli,
        previewSettings: state.previewSettings,
        currentStep: state.currentStep
      })
    }
  )
);