'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from '@/store/projectStore';
import { CATEGORIES } from '@/types';
import { formatTime } from '@/utils/time';
import styles from './PropertiesPanel.module.css';

export default function PropertiesPanel() {
  const { project, currentTime, selectedSoundId, updateSound, removeSound, pushHistory } = useEditorStore();
  const radarRef = useRef<HTMLDivElement>(null);

  const sound = project.sounds.find((s) => s.id === selectedSoundId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [soundNameInput, setSoundNameInput] = useState('');


  // ─── Radar Interactive Positioning ────────────────────────────
  const handleRadarClickOrDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!sound || !radarRef.current) return;
      const rect = radarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Radar center is at rect.width / 2, rect.height / 2
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalized coordinates from -1 to 1
      const normX = (clickX - centerX) / (rect.width / 2);
      const normY = (clickY - centerY) / (rect.height / 2);

      // Map to spatial X (-5 to 5) and Z (0 to 10 for distance)
      const newX = Math.max(-5, Math.min(5, normX * 5));
      const newZ = Math.max(0, Math.min(10, -normY * 5 + 5));

      pushHistory();
      updateSound(sound.id, {
        x: Math.round(newX * 10) / 10,
        z: Math.round(newZ * 10) / 10,
      });
    },
    [sound, pushHistory, updateSound]
  );

  if (!sound) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" strokeDasharray="3 3" opacity="0.4" />
              <circle cx="12" cy="12" r="6" strokeDasharray="2 2" opacity="0.7" />
              <circle cx="12" cy="12" r="2" fill="white" />
              <path d="M7 12a5 5 0 0 1 10 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h4 className={styles.emptyTitle}>Audio Inspector</h4>
          <p className={styles.emptyText}>
            Select a sound puck on the canvas or a timeline clip to inspect its 3D spatial acoustics.
          </p>
        </div>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === sound.category);

  const handleChange = (key: string, value: number | boolean | string) => {
    updateSound(sound.id, { [key]: value });
  };

  const handleChangeFinal = (key: string, value: number | boolean | string) => {
    pushHistory();
    updateSound(sound.id, { [key]: value });
  };

  // Calculate radar dot position percentage
  // X: -5 to +5 maps to 10% to 90%
  // Z: 0 to 10 maps to 80% to 20%
  const radarDotX = ((sound.x + 5) / 10) * 80 + 10;
  const radarDotY = (1 - sound.z / 10) * 60 + 20;

  return (
    <div className={styles.panel}>
      {/* ─── Header Card ───────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.soundInfo}>
          <div className={styles.soundIconCircle}>
            <span>{sound.icon}</span>
          </div>
          <div key={sound.id} className={styles.soundTitles}>
            {isEditingName ? (
              <input
                type="text"
                className={styles.soundNameInput}
                value={soundNameInput}
                autoFocus
                onChange={(e) => setSoundNameInput(e.target.value)}
                onBlur={() => {
                  const trimmed = soundNameInput.trim() || sound.name;
                  pushHistory();
                  updateSound(sound.id, { name: trimmed });
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setSoundNameInput(sound.name);
                    setIsEditingName(false);
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className={styles.soundNameBtn}
                onClick={() => {
                  setSoundNameInput(sound.name);
                  setIsEditingName(true);
                }}
                title="Click to rename sound layer"
              >
                <h3 className={styles.soundName}>{sound.name}</h3>
                <svg className={styles.editIcon} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <span className={styles.soundCategoryBadge}>
              {category?.label || sound.category}
            </span>
          </div>
        </div>

        <button
          className={styles.deleteBtn}
          onClick={() => removeSound(sound.id)}
          title="Delete sound layer"
          aria-label="Delete"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* ─── Scrollable Sections ───────────────────────────────── */}
      <div className={styles.sectionsScroll}>
        {/* ─── Timeline Placement & Quick Positioning ──────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className="text-label">Timeline Placement</span>
            <span className={styles.radarCoordinateTag}>
              {(sound.end - sound.start).toFixed(1)}s Clip
            </span>
          </div>

          {/* Start Time */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>Start Time (In-Point)</span>
              <span className={styles.fieldValuePill}>{formatTime(sound.start)} ({sound.start.toFixed(1)}s)</span>
            </div>
            <div className={styles.stepperRow}>
              <button
                className={styles.timeStepBtn}
                onClick={() => {
                  pushHistory();
                  const dur = sound.end - sound.start;
                  const newStart = Math.max(0, Math.round((sound.start - 0.5) * 10) / 10);
                  updateSound(sound.id, {
                    start: newStart,
                    end: Math.min(project.duration, Math.round((newStart + dur) * 10) / 10),
                  });
                }}
                title="Shift earlier by 0.5s"
              >
                −0.5s
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(0, project.duration - 0.5)}
                step={0.1}
                value={sound.start}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const dur = sound.end - sound.start;
                  updateSound(sound.id, {
                    start: val,
                    end: Math.min(project.duration, Math.round((val + dur) * 10) / 10),
                  });
                }}
                onMouseUp={() => pushHistory()}
              />
              <button
                className={styles.timeStepBtn}
                onClick={() => {
                  pushHistory();
                  const dur = sound.end - sound.start;
                  const newStart = Math.min(project.duration - 0.5, Math.round((sound.start + 0.5) * 10) / 10);
                  updateSound(sound.id, {
                    start: newStart,
                    end: Math.min(project.duration, Math.round((newStart + dur) * 10) / 10),
                  });
                }}
                title="Shift later by 0.5s"
              >
                +0.5s
              </button>
            </div>
          </div>

          {/* End Time */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>End Time (Out-Point)</span>
              <span className={styles.fieldValuePill}>{formatTime(sound.end)} ({sound.end.toFixed(1)}s)</span>
            </div>
            <input
              type="range"
              min={sound.start + 0.2}
              max={project.duration}
              step={0.1}
              value={sound.end}
              onChange={(e) => handleChange('end', parseFloat(e.target.value))}
              onMouseUp={(e) => handleChangeFinal('end', parseFloat((e.target as HTMLInputElement).value))}
            />
          </div>

          {/* Quick Positioning Buttons */}
          <div className={styles.quickAlignRow}>
            <button
              className={styles.alignPresetBtn}
              onClick={() => {
                pushHistory();
                const dur = sound.end - sound.start;
                updateSound(sound.id, { start: 0, end: Math.min(project.duration, dur) });
              }}
              title="Snap clip to start at 00:00.0"
            >
              ⏮ 0s
            </button>
            <button
              className={styles.alignPresetBtn}
              onClick={() => {
                pushHistory();
                const dur = sound.end - sound.start;
                const target = Math.min(5.0, project.duration - 0.5);
                updateSound(sound.id, { start: target, end: Math.min(project.duration, target + dur) });
              }}
              title="Move clip to start after 5 seconds"
            >
              ⏩ 5s
            </button>
            <button
              className={styles.alignPresetBtn}
              onClick={() => {
                pushHistory();
                const dur = sound.end - sound.start;
                const target = Math.min(currentTime, project.duration - 0.2);
                updateSound(sound.id, { start: target, end: Math.min(project.duration, target + dur) });
              }}
              title="Align clip start to current playhead position"
            >
              📍 At Playhead
            </button>
          </div>
        </div>

        {/* ─── 2D Spatial Soundfield Radar ─────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className="text-label">Binaural Soundfield</span>
            <span className={styles.radarCoordinateTag}>
              X: {sound.x > 0 ? `+${sound.x.toFixed(1)}` : sound.x.toFixed(1)}m
            </span>
          </div>

          <div
            ref={radarRef}
            className={styles.radarStage}
            onClick={handleRadarClickOrDrag}
            title="Click to reposition sound in the binaural soundfield"
          >
            {/* Concentric rings */}
            <div className={`${styles.radarRing} ${styles.radarRingFar}`} />
            <div className={`${styles.radarRing} ${styles.radarRingMid}`} />
            <div className={`${styles.radarRing} ${styles.radarRingNear}`} />

            {/* Crosshairs */}
            <div className={styles.radarCrosshairH} />
            <div className={styles.radarCrosshairV} />

            {/* Listener in center */}
            <div className={styles.listenerMarker} title="Listener (Headphones)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h1a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5v-1a7 7 0 0 1 14 0v1h-2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z" />
              </svg>
            </div>

            {/* Interactive Sound Puck on Radar */}
            <div
              className={styles.radarDot}
              style={{
                left: `${radarDotX}%`,
                top: `${radarDotY}%`,
              }}
            >
              <div className={styles.radarDotPulse} />
              <span>{sound.icon}</span>
            </div>

            {/* Stage orientation labels */}
            <span className={`${styles.radarLabel} ${styles.labelLeft}`}>L</span>
            <span className={`${styles.radarLabel} ${styles.labelRight}`}>R</span>
            <span className={`${styles.radarLabel} ${styles.labelFar}`}>FAR</span>
          </div>
        </div>

        {/* ─── Spatial Coordinates Controls ───────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className="text-label">3D Coordinates</span>
          </div>

          {/* X Position (Left / Right) */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>Azimuth (Left / Right)</span>
              <span className={styles.fieldValuePill}>
                {sound.x > 0 ? `+${sound.x.toFixed(1)}` : sound.x.toFixed(1)}m
              </span>
            </div>
            <input
              type="range"
              min={-5}
              max={5}
              step={0.1}
              value={sound.x}
              onChange={(e) => handleChange('x', parseFloat(e.target.value))}
              onMouseUp={(e) => handleChangeFinal('x', parseFloat((e.target as HTMLInputElement).value))}
            />
            <div className={styles.rangeSublabels}>
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>

          {/* Y Position (Elevation) */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>Elevation (Height)</span>
              <span className={styles.fieldValuePill}>
                {sound.y > 0 ? `+${sound.y.toFixed(1)}` : sound.y.toFixed(1)}m
              </span>
            </div>
            <input
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={sound.y}
              onChange={(e) => handleChange('y', parseFloat(e.target.value))}
              onMouseUp={(e) => handleChangeFinal('y', parseFloat((e.target as HTMLInputElement).value))}
            />
            <div className={styles.rangeSublabels}>
              <span>Bottom</span>
              <span>Eye Level</span>
              <span>Top</span>
            </div>
          </div>

          {/* Z Distance */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>Distance (Proximity)</span>
              <span className={styles.fieldValuePill}>{sound.z.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={sound.z}
              onChange={(e) => handleChange('z', parseFloat(e.target.value))}
              onMouseUp={(e) => handleChangeFinal('z', parseFloat((e.target as HTMLInputElement).value))}
            />
            <div className={styles.rangeSublabels}>
              <span>Intimate</span>
              <span>Medium</span>
              <span>Distant</span>
            </div>
          </div>
        </div>

        {/* ─── Volume & Acoustics ──────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className="text-label">Audio & Acoustics</span>
          </div>

          {/* Volume */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>Master Volume</span>
              <span className={styles.fieldValuePill}>{Math.round(sound.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.volume}
              onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
              onMouseUp={(e) => handleChangeFinal('volume', parseFloat((e.target as HTMLInputElement).value))}
            />
          </div>

          {/* Mute Toggle */}
          <div className={styles.toggleRow}>
            <span className={styles.fieldLabel}>Mute Sound Source</span>
            <label className={styles.switchWrapper}>
              <input
                type="checkbox"
                checked={sound.muted}
                onChange={(e) => handleChangeFinal('muted', e.target.checked)}
              />
              <span className="toggle-switch" />
            </label>
          </div>
        </div>

        {/* ─── Playback & Fades ─────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className="text-label">Playback & Fades</span>
          </div>

          {/* Loop Toggle */}
          <div className={styles.toggleRow}>
            <span className={styles.fieldLabel}>Loop Continuously</span>
            <label className={styles.switchWrapper}>
              <input
                type="checkbox"
                checked={sound.loop}
                onChange={(e) => handleChangeFinal('loop', e.target.checked)}
              />
              <span className="toggle-switch" />
            </label>
          </div>

          {/* Fade In */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>Fade In</span>
              <span className={styles.fieldValuePill}>{sound.fadeIn.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={sound.fadeIn}
              onChange={(e) => handleChange('fadeIn', parseFloat(e.target.value))}
              onMouseUp={(e) => handleChangeFinal('fadeIn', parseFloat((e.target as HTMLInputElement).value))}
            />
          </div>

          {/* Fade Out */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>Fade Out</span>
              <span className={styles.fieldValuePill}>{sound.fadeOut.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={sound.fadeOut}
              onChange={(e) => handleChange('fadeOut', parseFloat(e.target.value))}
              onMouseUp={(e) => handleChangeFinal('fadeOut', parseFloat((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
