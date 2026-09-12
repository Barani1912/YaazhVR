'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Group, Circle, Text, Ring, Rect } from 'react-konva';
import SoundSphere3D from './SoundSphere3D';
import { useEditorStore } from '@/store/projectStore';
import { imageToSpatial } from '@/utils/coordinates';
import { CATEGORIES, SoundAsset, SoundLayer } from '@/types';
import styles from './ImageCanvas.module.css';

// Category color map for sound puck accents
const catColorMap: Record<string, string> = {};
CATEGORIES.forEach((c) => { catColorMap[c.id] = c.color; });

export default function ImageCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [image, setImageObj] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const {
    project,
    selectedSoundId,
    canvasZoom,
    addSound,
    updateSound,
    setSelectedSound,
    setCanvasZoom,
    pushHistory,
  } = useEditorStore();

  // ─── Resize observer ──────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };
    updateSize();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setContainerSize({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [project.image]);

  // ─── Load image safely (Supports Blob URLs, Data URLs, and Remote URLs) ───
  useEffect(() => {
    let active = true;
    if (!project.image) {
      setImageObj(null);
      setImageSize({ width: 0, height: 0 });
      return () => {
        active = false;
      };
    }

    const img = new window.Image();
    // NEVER set crossOrigin on blob: or data: URLs (causes CORS rejection in Chromium)
    if (project.image.startsWith('http://') || project.image.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    const onImageLoaded = (loadedImg: HTMLImageElement) => {
      if (!active) return;
      setImageObj(loadedImg);
      const w = loadedImg.naturalWidth || loadedImg.width;
      const h = loadedImg.naturalHeight || loadedImg.height;
      if (w > 0 && h > 0) {
        setImageSize({ width: w, height: h });
      }
    };

    img.onload = () => onImageLoaded(img);
    img.onerror = (e) => {
      console.warn('Image load error with crossOrigin, retrying without crossOrigin:', e);
      if (img.crossOrigin) {
        const retry = new window.Image();
        retry.onload = () => onImageLoaded(retry);
        retry.src = project.image!;
      }
    };
    img.src = project.image;

    if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
      onImageLoaded(img);
    }

    return () => {
      active = false;
    };
  }, [project.image]);

  // ─── Calculate image display rect (fit to container) ──────────
  const getImageDisplayRect = useCallback(() => {
    const w = imageSize.width || (image ? image.naturalWidth : 0);
    const h = imageSize.height || (image ? image.naturalHeight : 0);

    if (w === 0 || h === 0) {
      return {
        x: Math.round(containerSize.width * 0.05),
        y: Math.round(containerSize.height * 0.05),
        width: Math.round(containerSize.width * 0.9),
        height: Math.round(containerSize.height * 0.9),
      };
    }

    const padding = 36;
    const maxW = Math.max(100, containerSize.width - padding * 2);
    const maxH = Math.max(100, containerSize.height - padding * 2);

    const scale = Math.min(maxW / w, maxH / h);
    const displayW = Math.round(w * scale * canvasZoom);
    const displayH = Math.round(h * scale * canvasZoom);

    return {
      x: Math.round((containerSize.width - displayW) / 2),
      y: Math.round((containerSize.height - displayH) / 2),
      width: displayW,
      height: displayH,
    };
  }, [image, containerSize, imageSize, canvasZoom]);

  const displayRect = getImageDisplayRect();

  // ─── Handle drop from sound library ────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);

    const data =
      e.dataTransfer.getData('application/yaazhvr-sound') ||
      e.dataTransfer.getData('application/echoframe-sound');
    if (!data) return;

    const sound: SoundAsset = JSON.parse(data);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clampedRelX = 0.5;
    let clampedRelY = 0.5;
    let spatial = { x: 0, y: 0, z: 1 };

    if (image && displayRect.width > 0 && displayRect.height > 0) {
      // Get drop position relative to image
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      // Convert to image-relative coordinates (0-1)
      const relX = (dropX - displayRect.x) / displayRect.width;
      const relY = (dropY - displayRect.y) / displayRect.height;

      // Clamp to image bounds
      clampedRelX = Math.max(0, Math.min(1, relX));
      clampedRelY = Math.max(0, Math.min(1, relY));

      // Spatial coordinates calculation
      const s = imageToSpatial(
        clampedRelX * imageSize.width,
        clampedRelY * imageSize.height,
        imageSize.width,
        imageSize.height
      );
      spatial = { x: s.x, y: s.y, z: 1 };
    } else {
      // Viewport-relative spatial calculation
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;
      const normX = (dropX - rect.width / 2) / (rect.width / 2);
      const normY = (rect.height / 2 - dropY) / (rect.height / 2);
      spatial = {
        x: Math.round(Math.max(-5, Math.min(5, normX * 5)) * 10) / 10,
        y: Math.round(Math.max(-3, Math.min(3, normY * 3)) * 10) / 10,
        z: 1,
      };
    }

    addSound({
      assetId: sound.id,
      file: sound.file,
      name: sound.name,
      category: sound.category,
      icon: sound.icon,
      x: spatial.x,
      y: spatial.y,
      z: spatial.z || 1,
      canvasX: clampedRelX,
      canvasY: clampedRelY,
      start: 0,
      end: Math.min(sound.duration, useEditorStore.getState().project.duration),
      volume: 0.85,
      loop: true,
      fadeIn: 0.3,
      fadeOut: 0.3,
      muted: false,
    });
  }, [image, displayRect, imageSize, addSound]);

  // ─── Handle pin drag ──────────────────────────────────────────
  const handlePinDragEnd = useCallback((soundId: string, newX: number, newY: number) => {
    if (displayRect.width === 0 || displayRect.height === 0) return;

    const relX = (newX - displayRect.x) / displayRect.width;
    const relY = (newY - displayRect.y) / displayRect.height;

    const clampedRelX = Math.max(0, Math.min(1, relX));
    const clampedRelY = Math.max(0, Math.min(1, relY));

    const spatial = imageToSpatial(
      clampedRelX * imageSize.width,
      clampedRelY * imageSize.height,
      imageSize.width,
      imageSize.height
    );

    pushHistory();
    updateSound(soundId, {
      canvasX: clampedRelX,
      canvasY: clampedRelY,
      x: spatial.x,
      y: spatial.y,
    });
  }, [displayRect, imageSize, pushHistory, updateSound]);

  // ─── Zoom handlers ────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setCanvasZoom(Math.max(0.5, Math.min(2.5, canvasZoom + delta)));
  }, [canvasZoom, setCanvasZoom]);

  const handleZoomReset = () => setCanvasZoom(1);
  const handleZoomIn = () => setCanvasZoom(Math.min(2.5, canvasZoom + 0.15));
  const handleZoomOut = () => setCanvasZoom(Math.max(0.5, canvasZoom - 0.15));

  // ─── Click on stage background deselects ──────────────────────
  const handleStageClick = useCallback((e: { target: { getStage: () => unknown } }) => {
    if (e.target === e.target.getStage()) {
      setSelectedSound(null);
    }
  }, [setSelectedSound]);

  // ─── 3D Sound Sphere View ────────────────────────────────────
  if (viewMode === '3d') {
    return <SoundSphere3D onExit3D={() => setViewMode('2d')} />;
  }

  // ─── Empty state ──────────────────────────────────────────────
  if (!project.image) {
    return (
      <div
        ref={containerRef}
        className={styles.canvasContainer}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className={styles.emptyState}>
          <div className={styles.emptySoundstageIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
              <circle cx="24" cy="24" r="15" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="1.2" opacity="0.6" />
              <circle cx="24" cy="24" r="3" fill="white" />
              {/* Headphone icon at center */}
              <path d="M19 24C19 21.2386 21.2386 19 24 19C26.7614 19 29 21.2386 29 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>Spatial Audio Viewport</h3>
          <p className={styles.emptySubtitle}>
            Import a scene photo from the <strong>Photo Media</strong> panel on the left to begin anchoring binaural sound sources.
          </p>
          <div className={styles.emptyHintPill}>
            <span>Binaural HRTF Engine Ready</span>
          </div>
        </div>

        {/* ─── Bottom-Right 3D Preview Button in Empty State ───────── */}
        <div className={styles.bottomRightAction}>
          <button
            className={styles.preview3dHeroBtn}
            onClick={() => setViewMode('3d')}
            title="Preview in 3D Skeletal Soundfield Sphere"
            aria-label="Preview in 3D"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Preview in 3D</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.canvasContainer} ${isDragOverCanvas ? styles.dropActive : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOverCanvas(true);
      }}
      onDragLeave={() => setIsDragOverCanvas(false)}
      onWheel={handleWheel}
    >
      {/* ─── Viewport Floating HUD ─────────────────────────────── */}
      <div className={styles.viewportHud}>
        <div className={styles.hudLeft}>
          <span className={styles.hudBadge}>VIEWPORT</span>
          <span className={styles.hudMeta}>{project.sounds.length} sound{project.sounds.length === 1 ? '' : 's'} placed</span>
        </div>

        <div className={styles.hudControls}>
          <button className={styles.hudBtn} onClick={handleZoomOut} title="Zoom Out (-)">
            −
          </button>
          <button className={styles.hudBtnReset} onClick={handleZoomReset} title="Reset Zoom (100%)">
            {Math.round(canvasZoom * 100)}%
          </button>
          <button className={styles.hudBtn} onClick={handleZoomIn} title="Zoom In (+)">
            +
          </button>
        </div>
      </div>

      {/* ─── Drop Overlay ──────────────────────────────────────── */}
      {isDragOverCanvas && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropOverlayPill}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Drop Sound Onto Scene</span>
          </div>
        </div>
      )}

      {/* ─── Hardware-Accelerated Scene Background Image ────────── */}
      {project.image && displayRect.width > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image}
          alt="Spatial Scene Background"
          style={{
            position: 'absolute',
            left: `${displayRect.x}px`,
            top: `${displayRect.y}px`,
            width: `${displayRect.width}px`,
            height: `${displayRect.height}px`,
            borderRadius: '10px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.14)',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 1,
            userSelect: 'none',
            display: 'block',
          }}
          onLoad={(e) => {
            const target = e.currentTarget;
            if (target.naturalWidth > 0 && (imageSize.width !== target.naturalWidth || imageSize.height !== target.naturalHeight)) {
              setImageSize({ width: target.naturalWidth, height: target.naturalHeight });
            }
          }}
        />
      )}

      {/* ─── Konva Canvas Stage for Interactive Sound Pins ───────── */}
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        onClick={handleStageClick}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <Layer>

          {/* Sound Pins / Spatial Pucks */}
          {project.sounds.map((sound) => {
            const pinX = sound.canvasX * displayRect.width + displayRect.x;
            const pinY = sound.canvasY * displayRect.height + displayRect.y;
            const isSelected = selectedSoundId === sound.id;
            const color = catColorMap[sound.category] || '#ffffff';

            return (
              <SoundPin
                key={sound.id}
                sound={sound}
                x={pinX}
                y={pinY}
                color={color}
                isSelected={isSelected}
                onSelect={() => setSelectedSound(sound.id)}
                onDragEnd={(newX, newY) => handlePinDragEnd(sound.id, newX, newY)}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* ─── Bottom-Right 3D Preview Button ───────────────────────── */}
      <div className={styles.bottomRightAction}>
        <button
          className={styles.preview3dHeroBtn}
          onClick={() => setViewMode('3d')}
          title="Preview in 3D Skeletal Soundfield Sphere"
          aria-label="Preview in 3D"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Preview in 3D</span>
        </button>
      </div>
    </div>
  );
}

// ─── Pro Sound Puck Sub-Component ────────────────────────────────
interface SoundPinProps {
  sound: SoundLayer;
  x: number;
  y: number;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}

function SoundPin({ sound, x, y, color, isSelected, onSelect, onDragEnd }: SoundPinProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pinRadius = isSelected ? 17 : 14;

  return (
    <Group
      x={x}
      y={y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onDragEnd(e.target.x(), e.target.y());
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Spatial Ripple Wave */}
      {isSelected && (
        <>
          <Ring
            innerRadius={pinRadius + 4}
            outerRadius={pinRadius + 7}
            fill="#ffffff"
            opacity={0.3}
          />
          <Ring
            innerRadius={pinRadius + 10}
            outerRadius={pinRadius + 12}
            fill="#ffffff"
            opacity={0.15}
          />
        </>
      )}

      {/* Subtle Distance Radius Ring */}
      <Circle
        radius={pinRadius + 16 - Math.min(10, sound.z * 0.6)}
        stroke={isSelected ? '#ffffff' : color}
        strokeWidth={1}
        opacity={isSelected ? 0.4 : 0.2}
        dash={[3, 4]}
      />

      {/* Main Puck Base (Glass obsidian circle with crisp white rim) */}
      <Circle
        radius={pinRadius}
        fill="#121215"
        stroke={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.35)'}
        strokeWidth={isSelected ? 2 : 1.2}
        shadowColor="#000000"
        shadowBlur={16}
        shadowOpacity={0.9}
        opacity={sound.muted ? 0.35 : 1}
      />

      {/* Subtle Inner Category Ring Indicator */}
      <Circle
        radius={pinRadius - 3}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.7}
      />

      {/* Sound Glyph Icon */}
      <Text
        text={sound.icon}
        fontSize={isSelected ? 14 : 12}
        x={-(isSelected ? 7 : 6)}
        y={-(isSelected ? 7 : 6)}
        listening={false}
      />

      {/* Label Tooltip with Pro Dark Pill */}
      {(isSelected || isHovered) && (
        <Group y={pinRadius + 8} listening={false}>
          {/* Pill backdrop */}
          <Rect
            x={-42}
            y={0}
            width={84}
            height={20}
            fill="#09090b"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
            cornerRadius={10}
            shadowColor="#000000"
            shadowBlur={8}
            shadowOpacity={0.8}
          />
          {/* Sound Name */}
          <Text
            text={sound.name}
            fontSize={10}
            fontFamily="Inter"
            fill="#ffffff"
            x={-40}
            y={5}
            width={80}
            align="center"
          />
        </Group>
      )}
    </Group>
  );
}
