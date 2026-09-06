import { SoundLayer } from '@/types';
import { clamp } from '@/utils/coordinates';

// ─── Audio Source Handle ──────────────────────────────────────────
interface AudioSource {
  id: string;
  buffer: AudioBuffer;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
  pannerNode: PannerNode;
  isPlaying: boolean;
}

// ─── Spatial Audio Engine (Singleton) ─────────────────────────────
class SpatialAudioEngine {
  private context: AudioContext | null = null;
  private sources: Map<string, AudioSource> = new Map();
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private masterGain: GainNode | null = null;

  // ─── Initialize AudioContext ──────────────────────────────────
  async init(): Promise<void> {
    if (this.context) return;

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);

    // Set listener at origin
    const listener = this.context.listener;
    if (listener.positionX) {
      listener.positionX.value = 0;
      listener.positionY.value = 0;
      listener.positionZ.value = 0;
      listener.forwardX.value = 0;
      listener.forwardY.value = 0;
      listener.forwardZ.value = -1;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      // Fallback for older browsers
      listener.setPosition(0, 0, 0);
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
  }

  // ─── Resume context (needed after user gesture) ───────────────
  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  // ─── Load and decode audio file ───────────────────────────────
  async loadAudio(url: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    await this.init();

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
    this.bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  // ─── Create a spatial audio source ────────────────────────────
  async createSource(layer: SoundLayer): Promise<void> {
    await this.init();

    // Remove existing source if re-creating
    if (this.sources.has(layer.id)) {
      this.stopSource(layer.id);
    }

    const buffer = await this.loadAudio(layer.file);

    const gainNode = this.context!.createGain();
    gainNode.gain.value = layer.muted ? 0 : layer.volume;

    const pannerNode = this.context!.createPanner();
    pannerNode.panningModel = 'HRTF';
    pannerNode.distanceModel = 'inverse';
    pannerNode.refDistance = 1;
    pannerNode.maxDistance = 25;
    pannerNode.rolloffFactor = 1;
    pannerNode.coneInnerAngle = 360;
    pannerNode.coneOuterAngle = 360;
    pannerNode.coneOuterGain = 0;

    // Set spatial position
    this.setPannerPosition(pannerNode, layer.x, layer.y, layer.z);

    // Connect: source → panner → gain → master
    pannerNode.connect(gainNode);
    gainNode.connect(this.masterGain!);

    this.sources.set(layer.id, {
      id: layer.id,
      buffer,
      sourceNode: null,
      gainNode,
      pannerNode,
      isPlaying: false,
    });
  }

  // ─── Set panner position ──────────────────────────────────────
  private setPannerPosition(panner: PannerNode, x: number, y: number, z: number): void {
    const clampedX = clamp(x, -5, 5);
    const clampedY = clamp(y, -3, 3);
    const clampedZ = clamp(z, 0, 20);

    if (panner.positionX) {
      panner.positionX.value = clampedX;
      panner.positionY.value = clampedY;
      panner.positionZ.value = -clampedZ; // Negative Z = in front
    } else {
      panner.setPosition(clampedX, clampedY, -clampedZ);
    }
  }

  // ─── Update position for an existing source ───────────────────
  updatePosition(id: string, x: number, y: number, z: number): void {
    const source = this.sources.get(id);
    if (!source) return;
    this.setPannerPosition(source.pannerNode, x, y, z);
  }

  // ─── Update volume ───────────────────────────────────────────
  setVolume(id: string, volume: number, muted: boolean = false): void {
    const source = this.sources.get(id);
    if (!source) return;
    source.gainNode.gain.setValueAtTime(
      muted ? 0 : clamp(volume, 0, 1),
      this.context!.currentTime
    );
  }

  // ─── Play a source with fade ──────────────────────────────────
  playSource(
    id: string,
    startOffset: number = 0,
    loop: boolean = false,
    fadeIn: number = 0,
    fadeOut: number = 0,
    duration?: number
  ): void {
    const source = this.sources.get(id);
    if (!source || !this.context || !source.buffer) return;

    // Stop existing playback
    if (source.sourceNode) {
      try {
        source.sourceNode.stop();
        source.sourceNode.disconnect();
      } catch {
        // Already stopped
      }
      source.sourceNode = null;
    }

    const bufDuration = source.buffer.duration;
    if (bufDuration <= 0) return;

    // Safety checks for offset
    if (!loop && startOffset >= bufDuration) {
      source.isPlaying = false;
      return;
    }
    const safeOffset = loop ? (startOffset % bufDuration) : Math.max(0, startOffset);

    const sourceNode = this.context.createBufferSource();
    sourceNode.buffer = source.buffer;
    sourceNode.loop = loop;
    sourceNode.connect(source.pannerNode);

    // Fade in
    const targetGain = source.gainNode.gain.value > 0 ? source.gainNode.gain.value : 0.85;
    if (fadeIn > 0) {
      source.gainNode.gain.cancelScheduledValues(this.context.currentTime);
      source.gainNode.gain.setValueAtTime(0, this.context.currentTime);
      source.gainNode.gain.linearRampToValueAtTime(
        targetGain,
        this.context.currentTime + fadeIn
      );
    }

    // Fade out
    if (fadeOut > 0 && duration && duration > fadeOut) {
      const fadeOutStart = this.context.currentTime + duration - fadeOut;
      source.gainNode.gain.setValueAtTime(targetGain, fadeOutStart);
      source.gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + fadeOut);
    }

    try {
      if (duration && !loop) {
        sourceNode.start(0, safeOffset, duration);
      } else {
        sourceNode.start(0, safeOffset);
      }
      source.sourceNode = sourceNode;
      source.isPlaying = true;

      sourceNode.onended = () => {
        if (source.sourceNode === sourceNode) {
          source.isPlaying = false;
        }
      };
    } catch (err) {
      console.warn('Audio playback start warning:', err);
      source.isPlaying = false;
    }
  }

  // ─── Check if a source is currently playing ───────────────────
  isSourcePlaying(id: string): boolean {
    return this.sources.get(id)?.isPlaying ?? false;
  }

  // ─── Stop a source ───────────────────────────────────────────
  stopSource(id: string): void {
    const source = this.sources.get(id);
    if (!source) return;

    if (source.sourceNode) {
      try {
        source.sourceNode.stop();
        source.sourceNode.disconnect();
      } catch {
        // Already stopped
      }
      source.sourceNode = null;
    }
    source.isPlaying = false;
  }

  // ─── Stop all sources ────────────────────────────────────────
  stopAll(): void {
    this.sources.forEach((_, id) => this.stopSource(id));
  }

  // ─── Remove a source entirely ────────────────────────────────
  removeSource(id: string): void {
    this.stopSource(id);
    const source = this.sources.get(id);
    if (source) {
      source.gainNode.disconnect();
      source.pannerNode.disconnect();
      this.sources.delete(id);
    }
  }

  // ─── Preview a sound (short play for library hover) ──────────
  private previewSourceNode: AudioBufferSourceNode | null = null;
  private previewGainNode: GainNode | null = null;

  async playPreview(url: string, duration: number = 2): Promise<void> {
    await this.init();
    await this.resume();
    this.stopPreview();

    const buffer = await this.loadAudio(url);
    this.previewGainNode = this.context!.createGain();
    this.previewGainNode.gain.value = 0.5;
    this.previewGainNode.connect(this.context!.destination);

    this.previewSourceNode = this.context!.createBufferSource();
    this.previewSourceNode.buffer = buffer;
    this.previewSourceNode.connect(this.previewGainNode);
    this.previewSourceNode.start(0, 0, duration);
  }

  stopPreview(): void {
    if (this.previewSourceNode) {
      try {
        this.previewSourceNode.stop();
        this.previewSourceNode.disconnect();
      } catch {
        // Already stopped
      }
      this.previewSourceNode = null;
    }
    if (this.previewGainNode) {
      this.previewGainNode.disconnect();
      this.previewGainNode = null;
    }
  }

  // ─── Get current context time ────────────────────────────────
  getCurrentTime(): number {
    return this.context?.currentTime ?? 0;
  }

  // ─── Cleanup ─────────────────────────────────────────────────
  destroy(): void {
    this.stopAll();
    this.stopPreview();
    this.sources.clear();
    this.bufferCache.clear();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

// ─── Export singleton ──────────────────────────────────────────────
export const audioEngine = new SpatialAudioEngine();
