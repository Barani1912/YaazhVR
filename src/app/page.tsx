'use client';

import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/projectStore';
import styles from './page.module.css';

// Dynamic imports for canvas-dependent components (no SSR)
const TopToolbar = dynamic(() => import('@/components/toolbar/TopToolbar'), { ssr: false });
const LeftSidebar = dynamic(() => import('@/components/sidebar/LeftSidebar'), { ssr: false });
const ImageCanvas = dynamic(() => import('@/components/canvas/ImageCanvas'), { ssr: false });
const PropertiesPanel = dynamic(() => import('@/components/properties/PropertiesPanel'), { ssr: false });
const Timeline = dynamic(() => import('@/components/timeline/Timeline'), { ssr: false });
const ExportModal = dynamic(() => import('@/components/export/ExportModal'), { ssr: false });
const KeyboardShortcuts = dynamic(() => import('@/components/KeyboardShortcuts'), { ssr: false });
const PlaybackProvider = dynamic(() => import('@/components/PlaybackProvider'), { ssr: false });

export default function EditorPage() {
  const { isFullScale3D } = useEditorStore();

  return (
    <PlaybackProvider>
      <div className={`${styles.editor} ${isFullScale3D ? styles.editorFullScale : ''}`}>
        <KeyboardShortcuts />
        <header className={styles.toolbar}>
          <TopToolbar />
        </header>
        {!isFullScale3D && (
          <aside className={styles.leftSidebar}>
            <LeftSidebar />
          </aside>
        )}
        <main className={styles.canvas}>
          <ImageCanvas />
        </main>
        {!isFullScale3D && (
          <aside className={styles.rightSidebar}>
            <PropertiesPanel />
          </aside>
        )}
        {!isFullScale3D && (
          <footer className={styles.timeline}>
            <Timeline />
          </footer>
        )}
        <ExportModal />
      </div>
    </PlaybackProvider>
  );
}
