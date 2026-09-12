'use client';

import { useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/projectStore';
import styles from './LeftSidebar.module.css';

// Curated Built-in Spatial Scene Presets (Self-contained high-res 16:9 scenes)
const SCENE_PRESETS = [
  {
    id: 'temple',
    name: 'Temple Sanctuary',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'><defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%231a0b2e'/><stop offset='50%' stop-color='%233b1d42'/><stop offset='100%' stop-color='%2311091a'/></linearGradient><radialGradient id='sun' cx='50%' cy='35%' r='45%'><stop offset='0%' stop-color='%23fbbf24' stop-opacity='0.9'/><stop offset='40%' stop-color='%23f59e0b' stop-opacity='0.4'/><stop offset='100%' stop-color='%23f59e0b' stop-opacity='0'/></radialGradient></defs><rect width='1600' height='900' fill='url(%23bg)'/><circle cx='800' cy='340' r='360' fill='url(%23sun)'/><rect x='0' y='680' width='1600' height='220' fill='%230f0616'/><path d='M250 900 L350 480 L450 900 Z M1150 900 L1250 480 L1350 900 Z' fill='%2324102c'/><rect x='640' y='420' width='320' height='480' rx='8' fill='%232b1335'/><polygon points='800,240 560,440 1040,440' fill='%23451a44'/><circle cx='800' cy='520' r='20' fill='%23fef08a'/></svg>",
  },
  {
    id: 'forest',
    name: 'Pine Forest',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'><defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%2306281e'/><stop offset='60%' stop-color='%230f3f31'/><stop offset='100%' stop-color='%23031510'/></linearGradient><radialGradient id='glow' cx='50%' cy='25%' r='55%'><stop offset='0%' stop-color='%2334d399' stop-opacity='0.6'/><stop offset='100%' stop-color='%2306281e' stop-opacity='0'/></radialGradient></defs><rect width='1600' height='900' fill='url(%23bg)'/><rect width='1600' height='900' fill='url(%23glow)'/><polygon points='800,160 620,580 980,580' fill='%23042118'/><polygon points='800,320 580,740 1020,740' fill='%23031a13'/><polygon points='380,240 240,700 520,700' fill='%23042118'/><polygon points='1220,240 1080,700 1360,700' fill='%23042118'/><rect x='0' y='720' width='1600' height='180' fill='%23020f0b'/></svg>",
  },
  {
    id: 'city',
    name: 'Neon Cityscape',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'><defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23050914'/><stop offset='60%' stop-color='%230d1b2a'/><stop offset='100%' stop-color='%23050811'/></linearGradient><linearGradient id='neon' x1='0' y1='0' x2='1' y2='0'><stop offset='0%' stop-color='%2306b6d4'/><stop offset='100%' stop-color='%23ec4899'/></linearGradient></defs><rect width='1600' height='900' fill='url(%23bg)'/><rect x='200' y='320' width='180' height='580' fill='%2308111e'/><rect x='440' y='180' width='240' height='720' fill='%230c1829'/><rect x='740' y='130' width='200' height='770' fill='%23101f35'/><rect x='990' y='220' width='220' height='680' fill='%230c1829'/><rect x='1240' y='300' width='190' height='600' fill='%2308111e'/><line x1='0' y1='740' x2='1600' y2='740' stroke='url(%23neon)' stroke-width='5'/><rect x='0' y='743' width='1600' height='157' fill='%2304060d'/></svg>",
  },
  {
    id: 'ocean',
    name: 'Sunset Coastline',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%231e1b4b'/><stop offset='45%' stop-color='%234338ca'/><stop offset='70%' stop-color='%23f43f5e'/><stop offset='100%' stop-color='%23fbbf24'/></linearGradient><linearGradient id='sea' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%230f172a'/><stop offset='100%' stop-color='%23020617'/></linearGradient></defs><rect width='1600' height='560' fill='url(%23sky)'/><circle cx='800' cy='520' r='140' fill='%23fef08a' opacity='0.95'/><rect y='530' width='1600' height='370' fill='url(%23sea)'/><path d='M0 640 Q 400 610 800 640 T 1600 640' stroke='%2338bdf8' stroke-width='2' fill='none' opacity='0.4'/><path d='M0 720 Q 400 690 800 720 T 1600 720' stroke='%2338bdf8' stroke-width='3' fill='none' opacity='0.3'/></svg>",
  },
];

export default function ImageUpload() {
  const { project, setImage, clearImage } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    setImage(file);
  }, [setImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSelectPreset = (preset: typeof SCENE_PRESETS[number]) => {
    setImage(preset.url, preset.name);
  };

  return (
    <div className={styles.imageCardContainer}>
      {/* If image is already uploaded, show active card */}
      {project.image ? (
        <>
          <div className={styles.imageCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.image}
              alt="Scene Background"
              className={styles.previewImage}
            />
            <div className={styles.imageBadge}>ACTIVE BACKGROUND</div>
          </div>

          <div className={styles.previewInfo}>
            <div className={styles.previewMetaRow}>
              <span className="text-label">Source</span>
              <span className={styles.previewMetaVal}>{project.imageFile?.name || 'Active Scene Photo'}</span>
            </div>
          </div>

          <div className={styles.previewActions}>
            <button className="btn btn-primary" onClick={handleClick} style={{ flex: 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Custom Photo
            </button>
            <button className="btn" onClick={clearImage} style={{ color: 'var(--error)' }} title="Remove photo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        /* Empty dropzone */
        <div
          className={`${styles.uploadZone} ${isDragOver ? styles.dragOver : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
          <div className={styles.uploadIconCircle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className={styles.uploadTitle}>Upload Scene Photo</div>
          <div className={styles.uploadSubtitle}>
            Drag & drop your photo here or click to browse
          </div>
          <div className={styles.uploadFormatsPill}>
            <span>JPG</span>
            <span>•</span>
            <span>PNG</span>
            <span>•</span>
            <span>WEBP</span>
          </div>
        </div>
      )}

      {/* ─── Curated Preset Scene Photos ────────────────────────── */}
      <div className={styles.presetSection}>
        <div className={styles.presetTitle}>Or Choose a Scene Preset</div>
        <div className={styles.presetGrid}>
          {SCENE_PRESETS.map((p) => (
            <button
              key={p.id}
              className={`${styles.presetCard} ${project.image === p.url ? styles.presetCardActive : ''}`}
              onClick={() => handleSelectPreset(p)}
              title={`Switch to ${p.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className={styles.presetThumb} />
              <span className={styles.presetLabel}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
