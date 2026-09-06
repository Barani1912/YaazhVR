'use client';

import { useEditorStore } from '@/store/projectStore';
import styles from './TopToolbar.module.css';

export default function TopToolbar() {
  const {
    project,
    canUndo,
    canRedo,
    isExporting,
    undo,
    redo,
    setIsExporting,
  } = useEditorStore();

  return (
    <div className={styles.toolbar}>
      {/* ─── Left: Brand & Project Name ────────────────────────── */}
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
              <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" opacity="0.8" />
              <circle cx="12" cy="12" r="2.5" fill="white" />
            </svg>
          </div>
          <span className={styles.brandTitle}>EchoFrame</span>
          <span className={styles.brandBadge}>STUDIO</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.projectPill}>
          <span className={styles.projectName}>{project.name || 'Untitled Project'}</span>
        </div>
      </div>

      {/* ─── Center: History Actions (Undo / Redo) ─────────────── */}
      <div className={styles.center}>
        <div className={styles.historyIsland}>
          <button
            className={`btn-icon ${styles.historyBtn}`}
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4" />
              <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
            </svg>
          </button>

          <div className={styles.historyDivider} />

          <button
            className={`btn-icon ${styles.historyBtn}`}
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 14 20 9 15 4" />
              <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Right: Primary Export Action ──────────────────────── */}
      <div className={styles.right}>
        <button
          className={styles.exportHeroBtn}
          onClick={() => setIsExporting(true)}
          disabled={isExporting}
          title="Export as MP4 with Spatial Audio"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export MP4</span>
        </button>
      </div>
    </div>
  );
}
