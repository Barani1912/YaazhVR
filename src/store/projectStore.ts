import { create } from 'zustand';
import { Project, SoundLayer, EditorState, SoundAsset } from '@/types';

// ─── Generate unique IDs ──────────────────────────────────────────
let idCounter = 0;
function generateId(): string {
  return `sound_${Date.now()}_${++idCounter}`;
}

const getStoredProjectName = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('yaazhvr_project_name');
      if (saved && saved.trim()) return saved.trim();
    } catch {
      // Ignore localStorage error
    }
  }
  return 'Untitled Project';
};

// ─── Default Project ──────────────────────────────────────────────
const defaultProject: Project = {
  id: 'project_1',
  name: getStoredProjectName(),
  duration: 10,
  image: null,
  imageFile: null,
  sounds: [],
};

// ─── History for Undo/Redo ────────────────────────────────────────
interface HistoryEntry {
  project: Project;
}

const MAX_HISTORY = 50;

// ─── Store Interface ──────────────────────────────────────────────
interface EditorStore extends EditorState {
  // History
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Custom User Sounds
  customSounds: SoundAsset[];
  addCustomSound: (sound: SoundAsset) => void;
  removeCustomSound: (id: string) => void;

  // Project actions
  setProjectName: (name: string) => void;
  setDuration: (duration: number) => void;
  setImage: (imageInput: File | string, fileName?: string) => void;
  clearImage: () => void;

  // Sound actions
  addSound: (sound: Omit<SoundLayer, 'id'>) => string;
  removeSound: (id: string) => void;
  updateSound: (id: string, updates: Partial<SoundLayer>) => void;
  duplicateSound: (id: string) => void;
  splitSound: (id: string, atTime: number) => void;

  // Selection
  setSelectedSound: (id: string | null) => void;
  setHoveredSound: (id: string | null) => void;

  // Playback
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  togglePlayback: () => void;

  // Canvas
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (x: number, y: number) => void;

  // Timeline
  setTimelineZoom: (zoom: number) => void;
  setTimelineScrollX: (x: number) => void;

  // Export
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;

  // 3D View Scale
  isFullScale3D: boolean;
  setIsFullScale3D: (full: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // ─── Initial State ────────────────────────────────────────────
  project: { ...defaultProject },
  selectedSoundId: null,
  hoveredSoundId: null,
  isPlaying: false,
  currentTime: 0,
  canvasZoom: 1,
  canvasPanX: 0,
  canvasPanY: 0,
  timelineZoom: 80, // pixels per second
  timelineScrollX: 0,
  isExporting: false,
  exportProgress: 0,
  isFullScale3D: false,
  setIsFullScale3D: (isFullScale3D) => set({ isFullScale3D }),

  // History
  history: [{ project: { ...defaultProject } }],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,

  // ─── Push to history (call before mutations) ──────────────────
  pushHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    const projectSnapshot = JSON.parse(JSON.stringify(state.project)) as Project;
    // Don't store File objects in history (not serializable)
    projectSnapshot.imageFile = null;
    newHistory.push({ project: projectSnapshot });
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  },

  // ─── Undo ─────────────────────────────────────────────────────
  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];
    set({
      project: {
        ...entry.project,
        imageFile: state.project.imageFile, // Preserve file reference
      },
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
      selectedSoundId: null,
    });
  },

  // ─── Redo ─────────────────────────────────────────────────────
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];
    set({
      project: {
        ...entry.project,
        imageFile: state.project.imageFile,
      },
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.history.length - 1,
      selectedSoundId: null,
    });
  },

  // ─── Project Actions ──────────────────────────────────────────
  setProjectName: (name) => {
    get().pushHistory();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yaazhvr_project_name', name);
      } catch {
        // Ignore localStorage error
      }
    }
    set((s) => ({ project: { ...s.project, name } }));
  },

  setDuration: (duration) => {
    get().pushHistory();
    set((s) => ({ project: { ...s.project, duration: Math.max(1, duration) } }));
  },

  setImage: (imageInput, fileName) => {
    get().pushHistory();
    if (typeof imageInput === 'string') {
      set((s) => ({
        project: {
          ...s.project,
          image: imageInput,
          imageFile: null,
        },
      }));
      return;
    }

    // Handle File object
    const file = imageInput;
    let url = '';
    try {
      url = URL.createObjectURL(file);
    } catch {
      url = '';
    }

    // Set immediate blob URL
    set((s) => ({
      project: { ...s.project, image: url, imageFile: file },
    }));

    // Also read as Data URL in background to ensure zero CORS and persistent storage
    if (typeof window !== 'undefined' && window.FileReader) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          set((s) => {
            // Only update if current image is still the active blob URL
            if (s.project.image === url) {
              return {
                project: { ...s.project, image: dataUrl, imageFile: file },
              };
            }
            return s;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  },

  clearImage: () => {
    const state = get();
    if (state.project.image) {
      URL.revokeObjectURL(state.project.image);
    }
    get().pushHistory();
    set((s) => ({
      project: { ...s.project, image: null, imageFile: null },
    }));
  },

  // ─── Sound Actions ────────────────────────────────────────────
  addSound: (soundData) => {
    const id = generateId();
    const sound: SoundLayer = { ...soundData, id };
    get().pushHistory();
    set((s) => ({
      project: {
        ...s.project,
        sounds: [...s.project.sounds, sound],
      },
      selectedSoundId: id,
    }));
    return id;
  },

  removeSound: (id) => {
    get().pushHistory();
    set((s) => ({
      project: {
        ...s.project,
        sounds: s.project.sounds.filter((s) => s.id !== id),
      },
      selectedSoundId: s.selectedSoundId === id ? null : s.selectedSoundId,
    }));
  },

  updateSound: (id, updates) => {
    set((s) => ({
      project: {
        ...s.project,
        sounds: s.project.sounds.map((sound) =>
          sound.id === id ? { ...sound, ...updates } : sound
        ),
      },
    }));
  },

  duplicateSound: (id) => {
    const state = get();
    const original = state.project.sounds.find((s) => s.id === id);
    if (!original) return;
    const newId = generateId();
    const duplicate: SoundLayer = {
      ...original,
      id: newId,
      name: `${original.name} (copy)`,
      canvasX: original.canvasX + 30,
      canvasY: original.canvasY + 30,
    };
    get().pushHistory();
    set((s) => ({
      project: {
        ...s.project,
        sounds: [...s.project.sounds, duplicate],
      },
      selectedSoundId: newId,
    }));
  },

  splitSound: (id, atTime) => {
    const state = get();
    const original = state.project.sounds.find((s) => s.id === id);
    if (!original) return;
    if (atTime <= original.start || atTime >= original.end) return;

    const newId = generateId();
    get().pushHistory();
    set((s) => ({
      project: {
        ...s.project,
        sounds: s.project.sounds.flatMap((sound) => {
          if (sound.id !== id) return [sound];
          return [
            { ...sound, end: atTime, fadeOut: 0 },
            {
              ...sound,
              id: newId,
              name: `${sound.name} (2)`,
              start: atTime,
              fadeIn: 0,
            },
          ];
        }),
      },
    }));
  },

  // ─── Selection ────────────────────────────────────────────────
  setSelectedSound: (id) => set({ selectedSoundId: id }),
  setHoveredSound: (id) => set({ hoveredSoundId: id }),

  // ─── Playback ─────────────────────────────────────────────────
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),

  // ─── Canvas ───────────────────────────────────────────────────
  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.1, Math.min(5, zoom)) }),
  setCanvasPan: (x, y) => set({ canvasPanX: x, canvasPanY: y }),

  // ─── Timeline ─────────────────────────────────────────────────
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(20, Math.min(400, zoom)) }),
  setTimelineScrollX: (x) => set({ timelineScrollX: Math.max(0, x) }),

  // ─── Custom Sounds ───────────────────────────────────────────
  customSounds: [],
  addCustomSound: (sound) =>
    set((s) => ({
      customSounds: [sound, ...s.customSounds.filter((existing) => existing.id !== sound.id)],
    })),
  removeCustomSound: (id) =>
    set((s) => ({
      customSounds: s.customSounds.filter((sound) => sound.id !== id),
    })),

  // ─── Export ───────────────────────────────────────────────────
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
}));
