'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { CATEGORIES, SOUND_LIBRARY, SoundAsset } from '@/types';
import { useEditorStore } from '@/store/projectStore';
import { audioEngine } from '@/audio/SpatialAudioEngine';
import { formatDuration } from '@/utils/time';
import styles from './LeftSidebar.module.css';

export default function SoundLibrary() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const previewTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { customSounds, addCustomSound, removeCustomSound, addSound } = useEditorStore();

  const handleAddSoundToProject = useCallback(
    (sound: SoundAsset, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const state = useEditorStore.getState();
      addSound({
        assetId: sound.id,
        file: sound.file,
        name: sound.name,
        category: sound.category,
        icon: sound.icon,
        x: 0,
        y: 0,
        z: 1,
        canvasX: 0.5,
        canvasY: 0.5,
        start: Math.round(state.currentTime * 10) / 10,
        end: Math.min(
          state.project.duration,
          Math.round((state.currentTime + sound.duration) * 10) / 10
        ),
        volume: 0.85,
        loop: true,
        fadeIn: 0.3,
        fadeOut: 0.3,
        muted: false,
      });
    },
    [addSound]
  );

  // Combine user uploads and built-in library sounds
  const allSounds = useMemo(() => {
    return [...customSounds, ...SOUND_LIBRARY];
  }, [customSounds]);

  // Filter sounds based on search and category pill
  const filteredSounds = useMemo(() => {
    return allSounds.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allSounds, search, selectedCategory]);

  const handleDragStart = useCallback((e: React.DragEvent, sound: SoundAsset) => {
    e.dataTransfer.setData('application/yaazhvr-sound', JSON.stringify(sound));
    e.dataTransfer.setData('application/echoframe-sound', JSON.stringify(sound));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleTogglePreview = useCallback((sound: SoundAsset, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewingId === sound.id) {
      if (previewTimeout.current) clearTimeout(previewTimeout.current);
      audioEngine.stopPreview();
      setPreviewingId(null);
      return;
    }

    if (previewTimeout.current) clearTimeout(previewTimeout.current);
    setPreviewingId(sound.id);
    audioEngine.playPreview(sound.file, 5).catch(() => {});

    previewTimeout.current = setTimeout(() => {
      audioEngine.stopPreview();
      setPreviewingId(null);
    }, 5000);
  }, [previewingId]);

  // Handle custom audio file processing
  const processAudioFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i)) {
      alert('Please upload a valid audio file (.mp3, .wav, .m4a, .ogg, .aac)');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    let duration = 10;

    try {
      const audio = new Audio();
      audio.src = objectUrl;
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            duration = Math.round(audio.duration);
          }
          resolve();
        };
        audio.onerror = () => resolve();
        setTimeout(resolve, 3000); // 3s fallback
      });
    } catch {
      // Fallback default duration
    }

    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();

    const newAsset: SoundAsset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      category: 'custom',
      file: objectUrl,
      duration: Math.max(1, duration),
      icon: '🎵',
    };

    addCustomSound(newAsset);
    setSelectedCategory('custom');
  }, [addCustomSound]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(processAudioFile);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processAudioFile]);

  const handleUploadBoxDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processAudioFile);
    }
  }, [processAudioFile]);

  const handleDeleteCustomSound = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingId === id) {
      audioEngine.stopPreview();
      setPreviewingId(null);
    }
    removeCustomSound(id);
  }, [previewingId, removeCustomSound]);

  return (
    <div className={styles.soundLibraryContainer}>
      {/* ─── Hidden Audio File Input ───────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* ─── Upload Sound Banner / Dropzone ───────────────────── */}
      <div
        className={`${styles.uploadSoundBox} ${isDragOverUpload ? styles.uploadSoundBoxDragOver : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOverUpload(true);
        }}
        onDragLeave={() => setIsDragOverUpload(false)}
        onDrop={handleUploadBoxDrop}
        title="Click or drag & drop custom sound effects (.mp3, .wav, .m4a)"
      >
        <div className={styles.uploadSoundIcon}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className={styles.uploadSoundText}>
          <span className={styles.uploadSoundTitle}>Upload Custom Audio</span>
          <span className={styles.uploadSoundSub}>Drop MP3, WAV, M4A or click to browse</span>
        </div>
      </div>

      {/* ─── Search Bar ────────────────────────────────────────── */}
      <div className={styles.searchWrapper}>
        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Search 50+ spatial sounds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchField}
        />
        {search && (
          <button className={styles.clearSearchBtn} onClick={() => setSearch('')}>
            ✕
          </button>
        )}
      </div>

      {/* ─── Category Filter Chips ─────────────────────────────── */}
      <div className={styles.categoryChips}>
        <button
          className={`${styles.chip} ${selectedCategory === 'all' ? styles.chipActive : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All ({allSounds.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = allSounds.filter((s) => s.category === cat.id).length;
          return (
            <button
              key={cat.id}
              className={`${styles.chip} ${selectedCategory === cat.id ? styles.chipActive : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={styles.chipCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Sound Cards Grid ──────────────────────────────────── */}
      <div className={styles.soundCardList}>
        {filteredSounds.map((sound) => {
          const isPreviewing = previewingId === sound.id;
          const isCustom = sound.category === 'custom';

          return (
            <div
              key={sound.id}
              className={`${styles.soundCard} ${isPreviewing ? styles.soundCardPreviewing : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, sound)}
              onDoubleClick={(e) => handleAddSoundToProject(sound, e)}
              title={`Drag or double-click to add "${sound.name}" to scene`}
            >
              {/* Left icon circle */}
              <div className={styles.soundIconCircle}>
                <span>{sound.icon}</span>
              </div>

              {/* Middle title & tag */}
              <div className={styles.soundDetails}>
                <span className={styles.soundCardTitle}>{sound.name}</span>
                <span className={styles.soundCardTag}>
                  {isCustom ? <span className={styles.customBadge}>Upload</span> : sound.category}
                </span>
              </div>

              {/* Right duration & actions */}
              <div className={styles.soundActions}>
                <span className={styles.soundDurationBadge}>{formatDuration(sound.duration)}</span>

                {/* Quick Add button */}
                <button
                  className={styles.addSoundBtn}
                  onClick={(e) => handleAddSoundToProject(sound, e)}
                  title={`Add "${sound.name}" to scene`}
                  aria-label="Add to scene"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                
                {/* Preview button */}
                <button
                  className={`${styles.previewTriggerBtn} ${isPreviewing ? styles.previewActive : ''}`}
                  onClick={(e) => handleTogglePreview(sound, e)}
                  title={isPreviewing ? 'Stop Preview' : 'Preview Sound'}
                  aria-label="Preview"
                >
                  {isPreviewing ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}>
                      <polygon points="6,4 20,12 6,20" />
                    </svg>
                  )}
                </button>

                {/* Custom sound delete button */}
                {isCustom && (
                  <button
                    className={styles.deleteCustomSoundBtn}
                    onClick={(e) => handleDeleteCustomSound(sound.id, e)}
                    title="Remove custom uploaded sound"
                    aria-label="Remove sound"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Subtle drag handle affordance */}
              <div className={styles.dragGrip} title="Drag to photo">
                <svg width="6" height="12" viewBox="0 0 6 12" fill="currentColor">
                  <circle cx="1.5" cy="2" r="1.2" />
                  <circle cx="4.5" cy="2" r="1.2" />
                  <circle cx="1.5" cy="6" r="1.2" />
                  <circle cx="4.5" cy="6" r="1.2" />
                  <circle cx="1.5" cy="10" r="1.2" />
                  <circle cx="4.5" cy="10" r="1.2" />
                </svg>
              </div>
            </div>
          );
        })}

        {filteredSounds.length === 0 && (
          <div className={styles.emptySoundState}>
            {selectedCategory === 'custom' ? (
              <span>No custom sounds uploaded yet. Click &quot;Upload Custom Audio&quot; above to add your own files.</span>
            ) : (
              <span>No sounds found matching &quot;{search}&quot;</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
