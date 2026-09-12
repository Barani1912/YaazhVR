# YaazhVR — Spatial Audio & Visual Studio

**YaazhVR** is a next-generation web-based spatial audio composition and video production suite. It empowers creators to bring still images and visual scenes to life by anchoring authentic 3D spatial sound sources into an interactive binaural acoustic soundfield, accompanied by a professional multitrack NLE timeline and client-side MP4 video rendering.

---

## ✨ Core Features

### 🎧 Real-Time 3D Binaural Spatial Audio Engine
- **Web Audio HRTF Spatial Panner**: Realistic Head-Related Transfer Function simulation delivering accurate Interaural Time Difference (ITD), Interaural Level Difference (ILD), and elevation spectral filtering.
- **3D Coordinate Mapping**: Seamlessly controls **Azimuth ($X$)**, **Elevation ($Y$)**, and **Distance Proximity ($Z$)** with physical inverse-distance attenuation.
- **2D Soundfield Radar**: Interactive overhead radar placing the listener at the center, enabling direct point-and-drag repositioning of sound sources in real time.
- **Spatial Audio Viewport**: Visual sound pucks anchored directly over images with concentric binaural ripple waves and distance tags.

### 🎞️ Pro Multitrack NLE Timeline
- **Dedicated Track Headers Column**: Distinct track sidebar (`T1`, `T2`, etc.) with quick mute toggles (`🔇`/`🔊`), preventing clip overlap and guaranteeing 100% clip visibility.
- **Clip Drag-to-Move**: Click and drag any clip body across the timeline to reposition its start time, complete with magnetic snapping (`0.1s`, `00:00.0`, and playhead position).
- **Dual-Edge Trimming**: Responsive **Left In-Point (`[`)** and **Right Out-Point (`]`)** trim handles with real-time HUD timestamp tooltips.
- **Precision Transport Controls**: Embedded Play/Pause, Stop/Return-to-zero, OLED timecode readout, and duration stepper directly in the timeline layer.
- **Split Clip Tool (`⌘B`)**: Instant waveform slicing at the current playhead needle.

### 🔊 50 Authentic Real-World Sound Effects & Custom Uploads
- **5 Curated Categories (10 Real CC0 Sounds Each)**:
  - 🌿 **Nature**: Birds, Heavy Rain, Light Rain, Thunderstorm, Gentle Wind, Howling Wind, River, Waterfall, Waves, Campfire
  - 🏙️ **City**: Traffic, Busy Street, Highway, Car Horn, Subway, Siren, Cafe Ambience, Construction, Bicycle Bell, Crowd
  - 🛕 **Temple**: Sanctuary, Singing Bowl, Wind Chimes, Sanctuary Bells, Ceremonial Gong, Brass Bell, Meditation Bell, Three Bells, Zen Droplets, Night Crickets
  - 👥 **People**: Applause, Group Cheer, Laughter, Giggle, Surprise Gasp, Gravel Footsteps, Leaves Footsteps, Snow Footsteps, Social Chatter, Whisper & Shhh
  - 🔥 **Objects**: Clock Ticking, Keyboard, Vintage Typewriter, Paper Rustling, Door Knock, Heavy Slam, Rotary Phone, Vinyl Crackle, Camera Shutter, Coins
- **Custom Audio Upload Engine**: Drag and drop your own `.mp3`, `.wav`, `.ogg`, or `.m4a` files with automated client-side duration calculation and waveform analysis.

### 🎬 Client-Side MP4 Export & Video Preview
- **OfflineAudioContext Spatial Rendering**: Renders multichannel 3D spatial audio buffers directly in the browser with sample accuracy.
- **FFmpeg WASM Integration**: Encodes visual frames and 3D binaural audio into high-definition `.mp4` video entirely on the client side—no backend server required.
- **Pre-Download Video Player**: Embedded video player inside the export modal allowing creators to inspect and preview their rendered spatial video before downloading.

---

## 📁 Project Architecture

```
yaazhvr/
├── docs/                        # Architecture & PRD specifications
│   └── BRD.md
├── public/
│   └── sounds/                  # 50 Authentic audio recordings
│       ├── city/
│       ├── nature/
│       ├── objects/
│       ├── people/
│       └── temple/
├── src/
│   ├── app/                     # Next.js App Router (Layout & Pages)
│   ├── audio/                   # Web Audio API 3D HRTF Spatial Engine
│   │   └── SpatialAudioEngine.ts
│   ├── components/
│   │   ├── canvas/              # Konva-based Viewport & Spatial Pucks
│   │   ├── export/              # Export Sheet & Embedded MP4 Player
│   │   ├── properties/          # Audio Inspector & Binaural Radar
│   │   ├── sidebar/             # Media Upload, Sound Studio & Custom Upload
│   │   ├── timeline/            # Multitrack Timeline & Dual-Edge Trimming
│   │   └── toolbar/             # Dynamic Island Top Toolbar
│   ├── export/                  # OfflineAudioContext + FFmpeg WASM Pipeline
│   │   └── exportPipeline.ts
│   ├── hooks/                   # Playback, Shortcuts & State Hooks
│   ├── store/                   # Zustand Project State & Undo/Redo Engine
│   ├── types/                   # TypeScript Domain Types & Sound Catalog
│   └── utils/                   # Coordinate Math, Time Formatting & Snapping
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.17.0 or higher recommended)
- npm, pnpm, or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Barani1912/YaazhVR.git
cd YaazhVR

# Install dependencies
npm install
```

### Running Locally
```bash
# Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (Chrome / Edge recommended for full Web Audio HRTF & WebCodecs support).

### Production Build
```bash
npm run build
npm run start
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause |
| `Esc` | Stop & Return to Zero (`00:00.0`) |
| `⌘Z` / `Ctrl+Z` | Undo |
| `⇧⌘Z` / `Ctrl+Y` | Redo |
| `⌘B` / `Ctrl+B` | Split Active Audio Clip at Playhead |
| `Delete` / `Backspace` | Delete Selected Sound Source |
| `Ctrl + Scroll` | Zoom Timeline In / Out |

---

## 📄 License
This project is licensed under the MIT License. Audio assets in `public/sounds` are CC0 Public Domain recordings.
