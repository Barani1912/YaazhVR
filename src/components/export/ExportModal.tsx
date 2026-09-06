'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/projectStore';
import styles from './ExportModal.module.css';

type ExportStage = 'settings' | 'exporting' | 'done' | 'error';

export default function ExportModal() {
  const {
    isExporting,
    exportProgress,
    project,
    setIsExporting,
    setExportProgress,
  } = useEditorStore();

  const [stage, setStage] = useState<ExportStage>('settings');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = useCallback(() => {
    setIsExporting(false);
    setStage('settings');
    setExportProgress(0);
    setDownloadUrl(null);
    setErrorMsg('');
  }, [setIsExporting, setExportProgress]);

  const handleExport = useCallback(async () => {
    setStage('exporting');
    setExportProgress(0);

    try {
      const { ExportEngine } = await import('@/export/ExportEngine');
      const engine = new ExportEngine((progress) => {
        setExportProgress(progress);
      });

      const mp4Url = await engine.exportMP4(project);
      setDownloadUrl(mp4Url);
      setStage('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Export failed');
      setStage('error');
    }
  }, [project, setExportProgress]);

  if (!isExporting) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ─── Header ────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.headerBadge}>MP4 RENDER</span>
            <h2 className={styles.title}>Export Spatial Video</h2>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ─── Settings Stage ────────────────────────────────────── */}
        {stage === 'settings' && (
          <div className={styles.content}>
            <div className={styles.specsList}>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Video Format</span>
                <span className={styles.specValue}>MP4 (H.264 / AAC)</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Duration</span>
                <span className={styles.specValue}>{project.duration}s</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Spatial Audio</span>
                <span className={styles.specValue}>Stereo Binaural (HRTF)</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Audio Layers</span>
                <span className={styles.specValue}>{project.sounds.length} Active Tracks</span>
              </div>
            </div>

            <div className={styles.note}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span>Best experienced with stereo headphones</span>
            </div>

            <button className={styles.primaryActionBtn} onClick={handleExport}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
              </svg>
              <span>Begin MP4 Render</span>
            </button>
          </div>
        )}

        {/* ─── Exporting Stage ───────────────────────────────────── */}
        {stage === 'exporting' && (
          <div className={styles.content}>
            <div className={styles.progressSection}>
              <div className={styles.spinnerWrapper}>
                <div className={styles.spinner} />
                <span className={styles.progressPercent}>{Math.round(exportProgress)}%</span>
              </div>
              <h3 className={styles.progressTitle}>Rendering Spatial Memory</h3>
              <p className={styles.progressText}>
                Encoding binaural soundfield and muxing video frames...
              </p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.max(5, exportProgress)}%` }}
                />
              </div>
            </div>
            <button className={styles.secondaryBtn} onClick={handleClose}>
              Cancel
            </button>
          </div>
        )}

        {/* ─── Done Stage ────────────────────────────────────────── */}
        {stage === 'done' && (
          <div className={styles.content}>
            <div className={styles.successSection}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>Render Complete!</h3>
              <p className={styles.successText}>
                Preview your rendered spatial audio video below before downloading.
              </p>
            </div>

            {/* Video Player Preview */}
            {downloadUrl && (
              <div className={styles.previewVideoContainer}>
                <video
                  className={styles.previewVideo}
                  src={downloadUrl}
                  controls
                  playsInline
                  autoPlay
                  loop
                />
              </div>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${project.name || 'echoframe'}_spatial.mp4`}
                className={styles.primaryActionBtn}
                style={{ textDecoration: 'none' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download MP4 Video</span>
              </a>
            )}
            <button className={styles.secondaryBtn} onClick={handleClose} style={{ marginTop: '8px' }}>
              Close
            </button>
          </div>
        )}

        {/* ─── Error Stage ───────────────────────────────────────── */}
        {stage === 'error' && (
          <div className={styles.content}>
            <div className={styles.errorSection}>
              <div className={styles.errorIcon}>✕</div>
              <h3 className={styles.errorTitle}>Render Error</h3>
              <p className={styles.errorText}>{errorMsg}</p>
            </div>
            <button className={styles.primaryActionBtn} onClick={() => setStage('settings')}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
