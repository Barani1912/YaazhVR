'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/store/projectStore';

/**
 * Global keyboard shortcuts handler.
 * Renders nothing — just registers event listeners.
 */
export default function KeyboardShortcuts() {
  const {
    selectedSoundId,
    isPlaying,
    currentTime,
    togglePlayback,
    undo,
    redo,
    removeSound,
    splitSound,
    setIsPlaying,
    setCurrentTime,
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Spacebar → Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
        return;
      }

      // Delete / Backspace → Remove selected sound
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedSoundId) {
        e.preventDefault();
        removeSound(selectedSoundId);
        return;
      }

      // Ctrl+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z → Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+B → Split at playhead
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyB' && selectedSoundId) {
        e.preventDefault();
        splitSound(selectedSoundId, currentTime);
        return;
      }

      // Escape → Deselect
      if (e.code === 'Escape') {
        useEditorStore.getState().setSelectedSound(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSoundId, currentTime, togglePlayback, undo, redo, removeSound, splitSound]);

  return null;
}
