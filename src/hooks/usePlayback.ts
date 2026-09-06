'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/projectStore';
import { audioEngine } from '@/audio/SpatialAudioEngine';

/**
 * Manages the playback loop using requestAnimationFrame.
 * Syncs currentTime with the spatial audio engine and timeline.
 * Does NOT use React state for per-frame updates (performance).
 */
export function usePlayback() {
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const stopPlayback = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isPlayingRef.current = false;
    audioEngine.stopAll();
    if (useEditorStore.getState().isPlaying) {
      useEditorStore.getState().setIsPlaying(false);
    }
  }, []);

  const startPlayback = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    try {
      await audioEngine.init();
      await audioEngine.resume();

      const state = useEditorStore.getState();

      // Ensure sources are created for all project sounds
      for (const sound of state.project.sounds) {
        if (!sound.muted) {
          await audioEngine.createSource(sound);
        }
      }

      // If at or past duration, wrap to beginning
      let initialTime = state.currentTime;
      if (initialTime >= state.project.duration - 0.05) {
        initialTime = 0;
        useEditorStore.getState().setCurrentTime(0);
      }

      startOffsetRef.current = initialTime;
      startTimeRef.current = performance.now() / 1000;

      // Start all sounds that are currently within their active range
      for (const sound of state.project.sounds) {
        if (!sound.muted && initialTime >= sound.start && initialTime < sound.end) {
          const offset = Math.max(0, initialTime - sound.start);
          audioEngine.playSource(
            sound.id,
            offset,
            sound.loop,
            sound.fadeIn,
            sound.fadeOut,
            sound.end - sound.start
          );
        }
      }

      // Ensure store isPlaying reflects true
      if (!useEditorStore.getState().isPlaying) {
        useEditorStore.getState().setIsPlaying(true);
      }

      // ─── Animation frame playback loop ────────────────────────
      const tick = () => {
        if (!isPlayingRef.current) return;

        const now = performance.now() / 1000;
        const elapsed = now - startTimeRef.current;
        const currentTime = startOffsetRef.current + elapsed;
        const duration = useEditorStore.getState().project.duration;

        if (currentTime >= duration) {
          // Reached end of timeline
          stopPlayback();
          useEditorStore.getState().setCurrentTime(0);
          return;
        }

        useEditorStore.getState().setCurrentTime(currentTime);

        // Check each sound: start if entering window, stop if exiting window
        const currentSounds = useEditorStore.getState().project.sounds;
        for (const sound of currentSounds) {
          const inRange = !sound.muted && currentTime >= sound.start && currentTime < sound.end;
          const isPlaying = audioEngine.isSourcePlaying(sound.id);

          if (inRange && !isPlaying) {
            const offset = Math.max(0, currentTime - sound.start);
            audioEngine.playSource(
              sound.id,
              offset,
              sound.loop,
              sound.fadeIn,
              sound.fadeOut,
              sound.end - sound.start
            );
          } else if (!inRange && isPlaying) {
            audioEngine.stopSource(sound.id);
          }
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Failed to start audio playback:', err);
      stopPlayback();
    }
  }, [stopPlayback]);

  // ─── Subscribe to isPlaying store changes ─────────────────────
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      if (state.isPlaying && !prevState.isPlaying) {
        startPlayback();
      } else if (!state.isPlaying && prevState.isPlaying) {
        stopPlayback();
      }
    });

    return () => {
      unsubscribe();
      stopPlayback();
    };
  }, [startPlayback, stopPlayback]);

  // ─── Handle seeking while playing ─────────────────────────────
  useEffect(() => {
    let lastTime = useEditorStore.getState().currentTime;
    const unsubscribe = useEditorStore.subscribe((state) => {
      if (isPlayingRef.current) {
        const diff = Math.abs(state.currentTime - lastTime);
        // If currentTime jumped by more than 0.25s, it was an explicit seek (ruler click / playhead drag)
        if (diff > 0.25) {
          startOffsetRef.current = state.currentTime;
          startTimeRef.current = performance.now() / 1000;

          audioEngine.stopAll();
          for (const sound of state.project.sounds) {
            if (!sound.muted && state.currentTime >= sound.start && state.currentTime < sound.end) {
              const offset = Math.max(0, state.currentTime - sound.start);
              audioEngine.playSource(
                sound.id,
                offset,
                sound.loop,
                sound.fadeIn,
                sound.fadeOut,
                sound.end - sound.start
              );
            }
          }
        }
      }
      lastTime = state.currentTime;
    });

    return () => unsubscribe();
  }, []);

  // ─── Update spatial positions & volumes in real-time ──────────
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state) => {
      for (const sound of state.project.sounds) {
        audioEngine.updatePosition(sound.id, sound.x, sound.y, sound.z);
        audioEngine.setVolume(sound.id, sound.volume, sound.muted);
      }
    });

    return () => unsubscribe();
  }, []);
}

