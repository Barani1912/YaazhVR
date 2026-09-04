// ─── Sound Categories ──────────────────────────────────────────────
export type SoundCategory = 'nature' | 'city' | 'temple' | 'people' | 'objects';

export interface SoundAsset {
  id: string;
  name: string;
  category: SoundCategory;
  file: string; // URL path to audio file
  duration: number; // seconds
  icon: string; // emoji or icon identifier
}

// ─── Sound Layer (placed on canvas) ────────────────────────────────
export interface SoundLayer {
  id: string;
  assetId: string;
  file: string;
  name: string;
  category: SoundCategory;
  icon: string;
  // Spatial position (mapped from canvas coords)
  x: number; // -5 to 5 (left to right)
  y: number; // -3 to 3 (bottom to top)
  z: number; // 0 to 20 (distance)
  // Canvas position (pixel coords on the image)
  canvasX: number;
  canvasY: number;
  // Timeline
  start: number; // seconds on timeline
  end: number; // seconds on timeline
  // Playback
  volume: number; // 0 to 1
  loop: boolean;
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  muted: boolean;
}

// ─── Project ───────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  duration: number; // seconds (default 10)
  image: string | null; // object URL or data URL
  imageFile: File | null;
  sounds: SoundLayer[];
}

// ─── Editor State ──────────────────────────────────────────────────
export interface EditorState {
  project: Project;
  // Selection
  selectedSoundId: string | null;
  hoveredSoundId: string | null;
  // Playback
  isPlaying: boolean;
  currentTime: number;
  // Canvas
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  // Timeline
  timelineZoom: number;
  timelineScrollX: number;
  // Export
  isExporting: boolean;
  exportProgress: number;
}

// ─── History (Undo/Redo) ───────────────────────────────────────────
export interface HistoryState {
  past: Project[];
  future: Project[];
  canUndo: boolean;
  canRedo: boolean;
}

// ─── Category metadata ────────────────────────────────────────────
export interface CategoryInfo {
  id: SoundCategory;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'nature', label: 'Nature', icon: '🌿', color: '#22C55E' },
  { id: 'city', label: 'City', icon: '🏙️', color: '#3B82F6' },
  { id: 'temple', label: 'Temple', icon: '🛕', color: '#F59E0B' },
  { id: 'people', label: 'People', icon: '👥', color: '#EC4899' },
  { id: 'objects', label: 'Objects', icon: '🔥', color: '#EF4444' },
];

// ─── Sound Library (built-in assets) ──────────────────────────────
export const SOUND_LIBRARY: SoundAsset[] = [
  // Nature
  { id: 'birds', name: 'Birds', category: 'nature', file: '/sounds/nature/birds.mp3', duration: 10, icon: '🐦' },
  { id: 'wind', name: 'Wind', category: 'nature', file: '/sounds/nature/wind.mp3', duration: 10, icon: '💨' },
  { id: 'rain', name: 'Rain', category: 'nature', file: '/sounds/nature/rain.mp3', duration: 10, icon: '🌧️' },
  { id: 'waterfall', name: 'Waterfall', category: 'nature', file: '/sounds/nature/waterfall.mp3', duration: 10, icon: '🌊' },
  { id: 'river', name: 'River', category: 'nature', file: '/sounds/nature/river.mp3', duration: 10, icon: '🏞️' },
  // City
  { id: 'traffic', name: 'Traffic', category: 'city', file: '/sounds/city/traffic.mp3', duration: 10, icon: '🚗' },
  { id: 'crowd', name: 'Crowd', category: 'city', file: '/sounds/city/crowd.mp3', duration: 10, icon: '👥' },
  { id: 'metro', name: 'Metro', category: 'city', file: '/sounds/city/metro.mp3', duration: 10, icon: '🚇' },
  // Temple
  { id: 'bell', name: 'Bell', category: 'temple', file: '/sounds/temple/bell.mp3', duration: 10, icon: '🔔' },
  { id: 'chanting', name: 'Chanting', category: 'temple', file: '/sounds/temple/chanting.mp3', duration: 10, icon: '🙏' },
  // People
  { id: 'laugh', name: 'Laugh', category: 'people', file: '/sounds/people/laugh.mp3', duration: 10, icon: '😂' },
  { id: 'clap', name: 'Clap', category: 'people', file: '/sounds/people/clap.mp3', duration: 10, icon: '👏' },
  { id: 'footsteps', name: 'Footsteps', category: 'people', file: '/sounds/people/footsteps.mp3', duration: 10, icon: '👣' },
  // Objects
  { id: 'fire', name: 'Fire', category: 'objects', file: '/sounds/objects/fire.mp3', duration: 10, icon: '🔥' },
  { id: 'camera', name: 'Camera', category: 'objects', file: '/sounds/objects/camera.mp3', duration: 10, icon: '📷' },
  { id: 'door', name: 'Door', category: 'objects', file: '/sounds/objects/door.mp3', duration: 10, icon: '🚪' },
];
