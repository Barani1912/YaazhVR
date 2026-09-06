// ─── Sound Categories ──────────────────────────────────────────────
export type SoundCategory = 'nature' | 'city' | 'temple' | 'people' | 'objects' | 'custom';

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
  { id: 'custom', label: 'Uploads', icon: '📁', color: '#A855F7' },
];

// ─── Sound Library (built-in real sound assets: 10 per category) ───
export const SOUND_LIBRARY: SoundAsset[] = [
  // ─── Nature (10 sounds) ──────────────────────────
  { id: 'birds', name: 'Forest Birds', category: 'nature', file: '/sounds/nature/birds.mp3', duration: 10, icon: '🐦' },
  { id: 'heavy_rain', name: 'Heavy Rain', category: 'nature', file: '/sounds/nature/heavy_rain.mp3', duration: 10, icon: '🌧️' },
  { id: 'light_rain', name: 'Light Rain', category: 'nature', file: '/sounds/nature/light_rain.mp3', duration: 10, icon: '🌦️' },
  { id: 'thunder', name: 'Thunderstorm', category: 'nature', file: '/sounds/nature/thunder.mp3', duration: 10, icon: '⚡' },
  { id: 'wind', name: 'Gentle Wind', category: 'nature', file: '/sounds/nature/wind.mp3', duration: 10, icon: '💨' },
  { id: 'howling_wind', name: 'Howling Wind', category: 'nature', file: '/sounds/nature/howling_wind.mp3', duration: 10, icon: '🌬️' },
  { id: 'river', name: 'River Stream', category: 'nature', file: '/sounds/nature/river.mp3', duration: 10, icon: '🏞️' },
  { id: 'waterfall', name: 'Waterfall', category: 'nature', file: '/sounds/nature/waterfall.mp3', duration: 10, icon: '🌊' },
  { id: 'ocean_waves', name: 'Ocean Waves', category: 'nature', file: '/sounds/nature/ocean_waves.mp3', duration: 10, icon: '🏖️' },
  { id: 'campfire', name: 'Campfire', category: 'nature', file: '/sounds/nature/campfire.mp3', duration: 10, icon: '🔥' },

  // ─── City (10 sounds) ────────────────────────────
  { id: 'traffic', name: 'City Traffic', category: 'city', file: '/sounds/city/traffic.mp3', duration: 10, icon: '🚗' },
  { id: 'busy_street', name: 'Busy Street', category: 'city', file: '/sounds/city/busy_street.mp3', duration: 10, icon: '🏙️' },
  { id: 'highway', name: 'Highway', category: 'city', file: '/sounds/city/highway.mp3', duration: 10, icon: '🛣️' },
  { id: 'car_horn', name: 'Car Horn', category: 'city', file: '/sounds/city/car_horn.mp3', duration: 5, icon: '📯' },
  { id: 'subway', name: 'Subway Station', category: 'city', file: '/sounds/city/subway.mp3', duration: 10, icon: '🚇' },
  { id: 'siren', name: 'Ambulance Siren', category: 'city', file: '/sounds/city/siren.mp3', duration: 10, icon: '🚨' },
  { id: 'cafe', name: 'Cafe Ambience', category: 'city', file: '/sounds/city/cafe.mp3', duration: 10, icon: '☕' },
  { id: 'construction', name: 'Construction Site', category: 'city', file: '/sounds/city/construction.mp3', duration: 10, icon: '🏗️' },
  { id: 'bicycle_bell', name: 'Bicycle Bell', category: 'city', file: '/sounds/city/bicycle_bell.mp3', duration: 3, icon: '🚲' },
  { id: 'crowd_city', name: 'City Crowd', category: 'city', file: '/sounds/city/crowd_city.mp3', duration: 10, icon: '👥' },

  // ─── Temple (10 sounds) ──────────────────────────
  { id: 'temple_ambience', name: 'Temple Sanctuary', category: 'temple', file: '/sounds/temple/temple_ambience.mp3', duration: 10, icon: '🛕' },
  { id: 'singing_bowl', name: 'Tibetan Singing Bowl', category: 'temple', file: '/sounds/temple/singing_bowl.mp3', duration: 10, icon: '🥣' },
  { id: 'wind_chimes', name: 'Temple Wind Chimes', category: 'temple', file: '/sounds/temple/wind_chimes.mp3', duration: 10, icon: '🎐' },
  { id: 'church_bells', name: 'Sanctuary Bells', category: 'temple', file: '/sounds/temple/church_bells.mp3', duration: 10, icon: '⛪' },
  { id: 'gong', name: 'Ceremonial Gong', category: 'temple', file: '/sounds/temple/gong.mp3', duration: 8, icon: '🛎️' },
  { id: 'temple_bell', name: 'Brass Bell', category: 'temple', file: '/sounds/temple/temple_bell.mp3', duration: 5, icon: '🔔' },
  { id: 'meditation_bell', name: 'Meditation Bell', category: 'temple', file: '/sounds/temple/meditation_bell.mp3', duration: 8, icon: '🧘' },
  { id: 'three_bells', name: 'Three Ring Bell', category: 'temple', file: '/sounds/temple/three_bells.mp3', duration: 10, icon: '✨' },
  { id: 'droplets_sanctuary', name: 'Zen Water Droplets', category: 'temple', file: '/sounds/temple/droplets_sanctuary.mp3', duration: 10, icon: '💧' },
  { id: 'night_temple', name: 'Night Shrine Crickets', category: 'temple', file: '/sounds/temple/night_temple.mp3', duration: 10, icon: '🦗' },

  // ─── People (10 sounds) ──────────────────────────
  { id: 'applause', name: 'Applause & Cheers', category: 'people', file: '/sounds/people/applause.mp3', duration: 8, icon: '👏' },
  { id: 'cheering', name: 'Group Cheer', category: 'people', file: '/sounds/people/cheering.mp3', duration: 5, icon: '🎉' },
  { id: 'laughter', name: 'Audience Laughter', category: 'people', file: '/sounds/people/laughter.mp3', duration: 6, icon: '😂' },
  { id: 'laughter_cute', name: 'Giggle & Chuckle', category: 'people', file: '/sounds/people/laughter_cute.mp3', duration: 4, icon: '😄' },
  { id: 'gasp', name: 'Surprise Gasp', category: 'people', file: '/sounds/people/gasp.mp3', duration: 3, icon: '😲' },
  { id: 'footsteps_gravel', name: 'Footsteps on Gravel', category: 'people', file: '/sounds/people/footsteps_gravel.mp3', duration: 10, icon: '👞' },
  { id: 'footsteps_leaves', name: 'Footsteps on Leaves', category: 'people', file: '/sounds/people/footsteps_leaves.mp3', duration: 10, icon: '🍂' },
  { id: 'footsteps_snow', name: 'Footsteps in Snow', category: 'people', file: '/sounds/people/footsteps_snow.mp3', duration: 10, icon: '❄️' },
  { id: 'crowded_bar', name: 'Social Chatter', category: 'people', file: '/sounds/people/crowded_bar.mp3', duration: 10, icon: '🗣️' },
  { id: 'shush', name: 'Whisper & Shhh', category: 'people', file: '/sounds/people/shush.mp3', duration: 4, icon: '🤫' },

  // ─── Objects (10 sounds) ─────────────────────────
  { id: 'clock', name: 'Clock Ticking', category: 'objects', file: '/sounds/objects/clock.mp3', duration: 10, icon: '⏰' },
  { id: 'keyboard', name: 'Keyboard Typing', category: 'objects', file: '/sounds/objects/keyboard.mp3', duration: 10, icon: '⌨️' },
  { id: 'typewriter', name: 'Vintage Typewriter', category: 'objects', file: '/sounds/objects/typewriter.mp3', duration: 10, icon: '📜' },
  { id: 'paper', name: 'Paper Rustling', category: 'objects', file: '/sounds/objects/paper.mp3', duration: 10, icon: '📄' },
  { id: 'door_knock', name: 'Door Knock', category: 'objects', file: '/sounds/objects/door_knock.mp3', duration: 4, icon: '🚪' },
  { id: 'door_slam', name: 'Heavy Door Slam', category: 'objects', file: '/sounds/objects/door_slam.mp3', duration: 4, icon: '🚪' },
  { id: 'telephone', name: 'Rotary Telephone', category: 'objects', file: '/sounds/objects/telephone.mp3', duration: 6, icon: '☎️' },
  { id: 'vinyl', name: 'Vinyl Crackle', category: 'objects', file: '/sounds/objects/vinyl.mp3', duration: 10, icon: '📻' },
  { id: 'camera', name: 'Camera Shutter', category: 'objects', file: '/sounds/objects/camera.mp3', duration: 3, icon: '📷' },
  { id: 'coins', name: 'Coins Dropping', category: 'objects', file: '/sounds/objects/coins.mp3', duration: 3, icon: '🪙' },
];
