'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useEditorStore } from '@/store/projectStore';
import { formatTime } from '@/utils/time';
import { CATEGORIES, SoundAsset } from '@/types';
import styles from './Timeline.module.css';

const TRACK_HEIGHT = 44;
const RULER_HEIGHT = 28;
const catColorMap: Record<string, string> = {};
CATEGORIES.forEach((c) => { catColorMap[c.id] = c.color; });

interface DragState {
  type: 'move' | 'trim-start' | 'trim-end';
  soundId: string;
  startX: number;
  initialStart: number;
  initialEnd: number;
  clipDuration: number;
  hasMoved: boolean;
}

export default function Timeline() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const headersRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(800);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const {
    project,
    currentTime,
    timelineZoom,
    selectedSoundId,
    isPlaying,
    setCurrentTime,
    setSelectedSound,
    setTimelineZoom,
    setTimelineScrollX,
    updateSound,
    splitSound,
    pushHistory,
    setDuration,
    setIsPlaying,
    togglePlayback,
    addSound,
  } = useEditorStore();

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [setIsPlaying, setCurrentTime]);

  // ─── Drop sound from Sound Studio directly onto timeline ──────
  const handleTimelineDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data =
        e.dataTransfer.getData('application/yaazhvr-sound') ||
        e.dataTransfer.getData('application/echoframe-sound');
      if (!data || !scrollAreaRef.current) return;

      try {
        const sound: SoundAsset = JSON.parse(data);
        const rect = scrollAreaRef.current.getBoundingClientRect();
        const dropX = e.clientX - rect.left + scrollAreaRef.current.scrollLeft;
        const dropTime = Math.max(
          0,
          Math.min(project.duration - 0.5, dropX / timelineZoom)
        );
        const roundedStart = Math.round(dropTime * 10) / 10;
        const roundedEnd = Math.min(
          project.duration,
          Math.round((roundedStart + sound.duration) * 10) / 10
        );

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
          start: roundedStart,
          end: roundedEnd,
          volume: 0.85,
          loop: true,
          fadeIn: 0.3,
          fadeOut: 0.3,
          muted: false,
        });
      } catch (err) {
        console.warn('Failed to drop sound onto timeline:', err);
      }
    },
    [project.duration, timelineZoom, addSound]
  );

  // ─── Resize observer on scroll container ──────────────────────
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(scrollArea);
    return () => observer.disconnect();
  }, []);

  // Total canvas width based on duration and zoom
  const totalWidth = Math.max(containerWidth, project.duration * timelineZoom + 120);

  // ─── Ruler tick marks ─────────────────────────────────────────
  const renderRuler = () => {
    const ticks: React.ReactNode[] = [];
    const step = timelineZoom >= 100 ? 1 : timelineZoom >= 50 ? 2 : 5;
    const subStep = step / 4;

    for (let t = 0; t <= project.duration; t += subStep) {
      const x = t * timelineZoom;
      const isMajor = Math.abs(t % step) < 0.001;
      ticks.push(
        <div
          key={t}
          className={`${styles.tick} ${isMajor ? styles.majorTick : styles.minorTick}`}
          style={{ left: `${x}px` }}
        >
          {isMajor && (
            <span className={styles.tickLabel}>{formatTime(t)}</span>
          )}
        </div>
      );
    }
    return ticks;
  };

  // ─── Ruler click seek ─────────────────────────────────────────
  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) return;
      const rect = scrollArea.getBoundingClientRect();
      const contentX = e.clientX - rect.left + scrollArea.scrollLeft;
      const time = Math.max(0, Math.min(project.duration, contentX / timelineZoom));
      setCurrentTime(time);
    },
    [timelineZoom, project.duration, setCurrentTime]
  );

  // ─── Playhead dragging ────────────────────────────────────────
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  }, []);

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) return;
      const rect = scrollArea.getBoundingClientRect();
      const contentX = e.clientX - rect.left + scrollArea.scrollLeft;
      const time = Math.max(0, Math.min(project.duration, contentX / timelineZoom));
      setCurrentTime(time);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, timelineZoom, project.duration, setCurrentTime]);

  // ─── Clip Dragging (Move) and Trimming (Dual-Edge) ─────────────
  const handleClipMouseDown = useCallback(
    (soundId: string, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setSelectedSound(soundId);

      const sound = project.sounds.find((s) => s.id === soundId);
      if (!sound) return;

      setDragState({
        type: 'move',
        soundId,
        startX: e.clientX,
        initialStart: sound.start,
        initialEnd: sound.end,
        clipDuration: sound.end - sound.start,
        hasMoved: false,
      });
    },
    [project.sounds, setSelectedSound]
  );

  const handleTrimMouseDown = useCallback(
    (soundId: string, edge: 'start' | 'end', e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setSelectedSound(soundId);

      const sound = project.sounds.find((s) => s.id === soundId);
      if (!sound) return;

      setDragState({
        type: edge === 'start' ? 'trim-start' : 'trim-end',
        soundId,
        startX: e.clientX,
        initialStart: sound.start,
        initialEnd: sound.end,
        clipDuration: sound.end - sound.start,
        hasMoved: false,
      });
    },
    [project.sounds, setSelectedSound]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaPx = e.clientX - dragState.startX;
      if (Math.abs(deltaPx) > 3) {
        dragState.hasMoved = true;
      }

      const deltaTime = deltaPx / timelineZoom;

      if (dragState.type === 'move') {
        const rawStart = dragState.initialStart + deltaTime;
        const clipDur = dragState.clipDuration;
        let newStart = Math.max(0, Math.min(project.duration - clipDur, rawStart));
        newStart = Math.round(newStart * 10) / 10;

        // Snapping: snap to 0s if close, snap to playhead if close
        if (newStart < 0.15) newStart = 0;
        else if (Math.abs(newStart - currentTime) < 0.15) {
          newStart = Math.round(currentTime * 10) / 10;
        }

        const newEnd = Math.round((newStart + clipDur) * 10) / 10;
        updateSound(dragState.soundId, { start: newStart, end: newEnd });
      } else if (dragState.type === 'trim-start') {
        const rawStart = dragState.initialStart + deltaTime;
        let newStart = Math.max(0, Math.min(dragState.initialEnd - 0.2, rawStart));
        newStart = Math.round(newStart * 10) / 10;
        if (newStart < 0.1) newStart = 0;
        updateSound(dragState.soundId, { start: newStart });
      } else if (dragState.type === 'trim-end') {
        const rawEnd = dragState.initialEnd + deltaTime;
        let newEnd = Math.max(dragState.initialStart + 0.2, Math.min(project.duration, rawEnd));
        newEnd = Math.round(newEnd * 10) / 10;
        if (Math.abs(newEnd - project.duration) < 0.1) newEnd = project.duration;
        updateSound(dragState.soundId, { end: newEnd });
      }
    };

    const handleMouseUp = () => {
      if (dragState.hasMoved) {
        pushHistory();
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, timelineZoom, project.duration, currentTime, updateSound, pushHistory]);

  // ─── Scroll handler (syncs horizontal offset and vertical track headers) ────
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setTimelineScrollX(e.currentTarget.scrollLeft);
      if (headersRef.current) {
        headersRef.current.scrollTop = e.currentTarget.scrollTop;
      }
    },
    [setTimelineScrollX]
  );

  // ─── Zoom with Ctrl+Wheel ─────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -12 : 12;
        setTimelineZoom(Math.max(30, Math.min(250, timelineZoom + delta)));
      }
    },
    [timelineZoom, setTimelineZoom]
  );

  // ─── Split active clip at playhead ────────────────────────────
  const handleSplit = () => {
    if (selectedSoundId) {
      splitSound(selectedSoundId, currentTime);
    }
  };

  return (
    <div className={styles.timeline} onWheel={handleWheel}>
      {/* ─── Timeline Toolbar (Transport, Audio Engine, Duration, Split) ─── */}
      <div className={styles.timelineToolbar}>
        {/* Left: Transport controls, Play, Timecode, Duration */}
        <div className={styles.toolbarLeft}>
          <span className={styles.timelineBadge}>TIMELINE</span>

          <div className={styles.toolbarDivider} />

          <div className={styles.transportGroup}>
            <button
              className={styles.transportBtn}
              onClick={handleStop}
              title="Stop & Return to Zero (Esc)"
              aria-label="Stop"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>

            <button
              className={styles.playHeroBtn}
              onClick={togglePlayback}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1.5" />
                  <rect x="14" y="5" width="4" height="14" rx="1.5" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </button>

            <div className={styles.timecodeDisplay}>
              <span className={styles.timecodeCurrent}>{formatTime(currentTime)}</span>
              <span className={styles.timecodeDivider}>/</span>
              <span className={styles.timecodeTotal}>{formatTime(project.duration)}</span>
            </div>

            <div className={styles.durationStepper}>
              <span className={styles.durLabel}>DUR</span>
              <button
                className={styles.durStepBtn}
                onClick={() => setDuration(Math.max(3, project.duration - 1))}
                title="Decrease duration by 1s"
              >
                −
              </button>
              <span className={styles.durValue}>{project.duration}</span>
              <button
                className={styles.durStepBtn}
                onClick={() => setDuration(Math.min(60, project.duration + 1))}
                title="Increase duration by 1s"
              >
                +
              </button>
              <span className={styles.durUnit}>s</span>
            </div>
          </div>
        </div>

        {/* Center: Live 3D Spatial Audio indicator and Split Clip tool */}
        <div className={styles.toolbarCenter}>
          <div className={styles.spatialPill} title="Real-time HRTF 3D spatial acoustics active in live preview">
            <span className={styles.spatialDot} />
            <span>3D Binaural Audio</span>
          </div>

          <button
            className={styles.toolBtn}
            onClick={handleSplit}
            disabled={!selectedSoundId}
            title="Split selected audio clip at current playhead position (⌘B)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            <span>Split Clip</span>
            <kbd className={styles.toolKbd}>⌘B</kbd>
          </button>
        </div>

        {/* Right: Track count badge & Zoom slider */}
        <div className={styles.toolbarRight}>
          <span className={styles.trackCount}>{project.sounds.length} Tracks</span>
          <div className={styles.toolbarDivider} />
          <div className={styles.zoomControlPill}>
            <button
              className={styles.zoomStepBtn}
              onClick={() => setTimelineZoom(Math.max(30, timelineZoom - 20))}
              title="Zoom Out (−)"
            >
              −
            </button>
            <button
              className={styles.zoomLabel}
              onClick={() => setTimelineZoom(100)}
              title="Reset Timeline Zoom (100%)"
              aria-label="Reset zoom to 100%"
            >
              {Math.round(timelineZoom)}%
            </button>
            <button
              className={styles.zoomStepBtn}
              onClick={() => setTimelineZoom(Math.min(250, timelineZoom + 20))}
              title="Zoom In (+)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ─── Dedicated Two-Column Timeline Body ─────────────────── */}
      <div className={styles.timelineBody}>
        {/* Fixed Left Track Headers Sidebar */}
        <div className={styles.trackHeadersColumn}>
          {/* Corner Header aligned with Ruler height */}
          <div className={styles.cornerHeader} style={{ height: `${RULER_HEIGHT}px` }}>
            <span className={styles.cornerLabel}>TRACKS</span>
          </div>

          {/* Track Headers List (Synced with vertical scroll) */}
          <div className={styles.trackHeadersList} ref={headersRef}>
            {project.sounds.map((sound, index) => {
              const isSelected = selectedSoundId === sound.id;
              return (
                <div
                  key={sound.id}
                  className={`${styles.trackHeaderCell} ${isSelected ? styles.trackHeaderSelected : ''}`}
                  style={{ height: `${TRACK_HEIGHT}px` }}
                  onClick={() => setSelectedSound(sound.id)}
                  title={`Select Track ${index + 1}: ${sound.name}`}
                >
                  <span className={styles.trackNum}>T{index + 1}</span>
                  <span className={styles.trackIcon}>{sound.icon}</span>
                  <span className={styles.trackHeaderName}>{sound.name}</span>
                  <button
                    className={`${styles.trackMuteBtn} ${sound.muted ? styles.trackMuted : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSound(sound.id, { muted: !sound.muted });
                    }}
                    title={sound.muted ? 'Unmute track' : 'Mute track'}
                    aria-label="Mute toggle"
                  >
                    {sound.muted ? '🔇' : '🔊'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Tracks Canvas (Ruler + Multitrack Clip Lanes) */}
        <div
          className={styles.scrollArea}
          ref={scrollAreaRef}
          onScroll={handleScroll}
        >
          <div className={styles.scrollContent} style={{ width: `${totalWidth}px` }}>
            {/* Time Ruler */}
            <div
              className={styles.ruler}
              onClick={handleRulerClick}
              style={{ height: `${RULER_HEIGHT}px` }}
              title="Click anywhere to seek playhead"
            >
              {renderRuler()}
            </div>

            {/* Multitrack Stacking Area */}
            <div
              className={styles.tracks}
              ref={tracksRef}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={handleTimelineDrop}
            >
              {project.sounds.length === 0 ? (
                <div className={styles.tracksEmpty}>
                  <div className={styles.emptyTracksIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <line x1="2" y1="6" x2="22" y2="6" strokeDasharray="3 3" />
                      <line x1="2" y1="18" x2="22" y2="18" strokeDasharray="3 3" />
                    </svg>
                  </div>
                  <span>Drag sounds onto the canvas or drop here to populate audio tracks</span>
                </div>
              ) : (
                project.sounds.map((sound) => {
                  const startX = sound.start * timelineZoom;
                  const endX = sound.end * timelineZoom;
                  const width = Math.max(endX - startX, 16);
                  const isSelected = selectedSoundId === sound.id;
                  const isDraggingThisClip = dragState?.soundId === sound.id;

                  return (
                    <div
                      key={sound.id}
                      className={styles.trackRow}
                      style={{ height: `${TRACK_HEIGHT}px`, width: `${totalWidth}px` }}
                    >
                      {/* Pro Audio Clip */}
                      <div
                        className={`${styles.clip} ${isSelected ? styles.clipSelected : ''} ${sound.muted ? styles.clipMuted : ''} ${isDraggingThisClip ? styles.clipDragging : ''}`}
                        style={{
                          left: `${startX}px`,
                          width: `${width}px`,
                          borderColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.14)',
                        }}
                        onMouseDown={(e) => handleClipMouseDown(sound.id, e)}
                        title="Click to select, drag body to reposition in time"
                      >
                        {/* Left Trim Handle (Start Time) */}
                        <div
                          className={`${styles.trimHandle} ${styles.trimHandleLeft}`}
                          onMouseDown={(e) => handleTrimMouseDown(sound.id, 'start', e)}
                          title="Drag to trim start time (in-point)"
                        >
                          <div className={styles.trimBracketLeft} />
                        </div>

                        {/* Clip Body & Waveform Lines */}
                        <div className={styles.clipBody}>
                          {/* Simulated audio waveform peaks */}
                          <div className={styles.waveformContainer} />

                          <div className={styles.clipMeta}>
                            <span className={styles.clipTitle}>{sound.name}</span>
                            {sound.loop && <span className={styles.loopChip}>LOOP</span>}
                            <span className={styles.clipDurationChip}>
                              {(sound.end - sound.start).toFixed(1)}s
                            </span>
                          </div>
                        </div>

                        {/* Fade Overlays */}
                        {sound.fadeIn > 0 && (
                          <div
                            className={styles.fadeInOverlay}
                            style={{ width: `${sound.fadeIn * timelineZoom}px` }}
                          />
                        )}
                        {sound.fadeOut > 0 && (
                          <div
                            className={styles.fadeOutOverlay}
                            style={{ width: `${sound.fadeOut * timelineZoom}px` }}
                          />
                        )}

                        {/* Right Trim Handle (End Time) */}
                        <div
                          className={`${styles.trimHandle} ${styles.trimHandleRight}`}
                          onMouseDown={(e) => handleTrimMouseDown(sound.id, 'end', e)}
                          title="Drag to trim end time (out-point)"
                        >
                          <div className={styles.trimBracketRight} />
                        </div>

                        {/* Live Dragging & Trimming Floating Tooltip */}
                        {isDraggingThisClip && (
                          <div className={styles.clipTooltip}>
                            {dragState.type === 'move' && `Move: ${formatTime(sound.start)} → ${formatTime(sound.end)}`}
                            {dragState.type === 'trim-start' && `Trim Start: ${formatTime(sound.start)}`}
                            {dragState.type === 'trim-end' && `Trim End: ${formatTime(sound.end)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Precision Red Playhead */}
            <div
              className={styles.playhead}
              style={{ left: `${currentTime * timelineZoom}px` }}
            >
              <div
                className={styles.playheadNeedleHead}
                onMouseDown={handlePlayheadMouseDown}
                title="Drag playhead to scrub audio"
              />
              <div className={styles.playheadVerticalLine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
