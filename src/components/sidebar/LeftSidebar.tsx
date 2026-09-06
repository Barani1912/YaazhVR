'use client';

import { useState } from 'react';
import ImageUpload from './ImageUpload';
import SoundLibrary from './SoundLibrary';
import styles from './LeftSidebar.module.css';

type Tab = 'upload' | 'sounds';

export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('sounds');

  return (
    <div className={styles.sidebar}>
      {/* ─── Apple Segmented Tab Switcher ─────────────────────── */}
      <div className={styles.tabContainer}>
        <div className="segmented-control" style={{ width: '100%' }}>
          <button
            className={`segmented-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Photo Media</span>
          </button>
          <button
            className={`segmented-item ${activeTab === 'sounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('sounds')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span>Sound Studio</span>
          </button>
        </div>
      </div>

      {/* ─── Scrollable Workspace Content ──────────────────────── */}
      <div className={styles.content}>
        {activeTab === 'upload' ? <ImageUpload /> : <SoundLibrary />}
      </div>
    </div>
  );
}
