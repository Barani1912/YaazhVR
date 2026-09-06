'use client';

import { usePlayback } from '@/hooks/usePlayback';

/**
 * Provider component that initializes the playback engine.
 * Must be rendered inside the editor page.
 */
export default function PlaybackProvider({ children }: { children: React.ReactNode }) {
  usePlayback();
  return <>{children}</>;
}
