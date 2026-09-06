'use client';

import { useRef, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/projectStore';
import styles from './LeftSidebar.module.css';

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

  // If image is already uploaded, show pro preview card
  if (project.image) {
    return (
      <div className={styles.imageCardContainer}>
        <div className={styles.imageCard}>
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
            <span className={styles.previewMetaVal}>{project.imageFile?.name || 'Uploaded Photo'}</span>
          </div>
        </div>

        <div className={styles.previewActions}>
          <button className="btn btn-primary" onClick={handleClick} style={{ flex: 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Replace Photo
          </button>
          <button className="btn" onClick={clearImage} style={{ color: 'var(--error)' }} title="Remove photo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
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

  // Empty state: Apple-style dropzone card
  return (
    <>
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
        <div className={styles.uploadTitle}>Import Scene Photo</div>
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </>
  );
}
