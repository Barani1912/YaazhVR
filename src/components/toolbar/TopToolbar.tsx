'use client';

import { useState, useRef, useEffect } from 'react';
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
    setProjectName,
  } = useEditorStore();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(project.name || 'Untitled Project');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim() || 'Untitled Project';
    setProjectName(trimmed);
    setNameInput(trimmed);
    setIsEditing(false);
  };

  const handleCancelName = () => {
    setNameInput(project.name || 'Untitled Project');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelName();
    }
  };

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
          <span className={styles.brandTitle}>Yaazh VR</span>
          <span className={styles.brandBadge}>STUDIO</span>
        </div>

        <div className={styles.divider} />

        {isEditing ? (
          <div className={styles.projectPillEditing}>
            <input
              ref={inputRef}
              type="text"
              className={styles.projectNameInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveName}
              maxLength={60}
              placeholder="Project Name"
              aria-label="Project Name"
            />
            <button
              type="button"
              className={styles.pillActionBtn}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSaveName();
              }}
              title="Save project name (Enter)"
              aria-label="Save"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.pillActionBtn}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCancelName();
              }}
              title="Cancel (Esc)"
              aria-label="Cancel"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.projectPill}
            onClick={() => {
              setNameInput(project.name || 'Untitled Project');
              setIsEditing(true);
            }}
            title="Click to rename project"
            aria-label={`Project: ${project.name || 'Untitled Project'}. Click to rename`}
          >
            <span className={styles.projectName}>{project.name || 'Untitled Project'}</span>
            <svg
              className={styles.editIcon}
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
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
