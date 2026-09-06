import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Project, SoundLayer } from '@/types';
import { clamp } from '@/utils/coordinates';

// Helper to convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const bufferLength = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const offset = 44;
  let pos = 0;
  
  if (numChannels === 2) {
    const channel1 = buffer.getChannelData(0);
    const channel2 = buffer.getChannelData(1);
    for (let i = 0; i < buffer.length; i++) {
      // Interleave channels
      let sample1 = Math.max(-1, Math.min(1, channel1[i]));
      let sample2 = Math.max(-1, Math.min(1, channel2[i]));
      view.setInt16(offset + pos, sample1 < 0 ? sample1 * 0x8000 : sample1 * 0x7FFF, true);
      pos += 2;
      view.setInt16(offset + pos, sample2 < 0 ? sample2 * 0x8000 : sample2 * 0x7FFF, true);
      pos += 2;
    }
  } else {
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      let sample = Math.max(-1, Math.min(1, channel[i]));
      view.setInt16(offset + pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
  }

  return new Uint8Array(arrayBuffer);
}

export class ExportEngine {
  private ffmpeg: FFmpeg | null = null;
  private onProgress: (progress: number) => void;

  constructor(onProgress: (progress: number) => void) {
    this.onProgress = onProgress;
  }

  // Load FFmpeg instance
  private async loadFFmpeg() {
    if (this.ffmpeg) return this.ffmpeg;

    const ffmpeg = new FFmpeg();
    
    // Using unpkg for core files
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    // Set a progress handler for FFmpeg step (progress from 50 to 100)
    ffmpeg.on('progress', ({ progress }) => {
      // Progress comes in as 0-1, map it to 50%-100%
      this.onProgress(50 + progress * 50);
    });
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.ffmpeg = ffmpeg;
    return ffmpeg;
  }

  // Render the audio scene offline
  private async renderAudio(project: Project): Promise<Uint8Array> {
    const sampleRate = 44100;
    const duration = project.duration;
    
    // Create OfflineAudioContext (2 channels for stereo/spatial)
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
    
    // Set listener position
    const listener = offlineCtx.listener;
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
      listener.setPosition(0, 0, 0);
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
    
    // Fetch and decode all audio buffers using the normal AudioContext
    // OfflineAudioContext can't decodeAudioData reliably in some browsers without user interaction
    // So we use a temporary normal context to decode
    const tempCtx = new AudioContext();
    const buffers = new Map<string, AudioBuffer>();
    
    let loadedCount = 0;
    for (const sound of project.sounds) {
      if (!buffers.has(sound.file)) {
        try {
          const res = await fetch(sound.file);
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
          buffers.set(sound.file, audioBuffer);
        } catch (err) {
          console.error('Failed to load audio', sound.file, err);
        }
      }
      loadedCount++;
      // Map loading progress up to 20%
      this.onProgress(loadedCount / project.sounds.length * 20);
    }
    tempCtx.close();
    
    // Build the offline scene
    for (const sound of project.sounds) {
      if (sound.muted) continue;
      const buffer = buffers.get(sound.file);
      if (!buffer) continue;
      
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = sound.loop;
      
      const gainNode = offlineCtx.createGain();
      
      // Calculate start and end offsets relative to the sound's active region
      // If loop is true, the source will loop. We just need to start and stop it.
      
      const pannerNode = offlineCtx.createPanner();
      pannerNode.panningModel = 'HRTF';
      pannerNode.distanceModel = 'inverse';
      pannerNode.refDistance = 1;
      pannerNode.maxDistance = 25;
      
      const clampedX = clamp(sound.x, -5, 5);
      const clampedY = clamp(sound.y, -3, 3);
      const clampedZ = clamp(sound.z, 0, 20);
      if (pannerNode.positionX) {
        pannerNode.positionX.value = clampedX;
        pannerNode.positionY.value = clampedY;
        pannerNode.positionZ.value = -clampedZ;
      } else {
        pannerNode.setPosition(clampedX, clampedY, -clampedZ);
      }
      
      // Connect nodes
      source.connect(pannerNode);
      pannerNode.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      
      // Handle volume and fades
      const targetVolume = sound.volume;
      
      // Initial volume
      if (sound.fadeIn > 0) {
        gainNode.gain.setValueAtTime(0, sound.start);
        gainNode.gain.linearRampToValueAtTime(targetVolume, sound.start + sound.fadeIn);
      } else {
        gainNode.gain.setValueAtTime(targetVolume, sound.start);
      }
      
      if (sound.fadeOut > 0) {
        const fadeOutStart = sound.end - sound.fadeOut;
        if (fadeOutStart > sound.start) {
          gainNode.gain.setValueAtTime(targetVolume, fadeOutStart);
          gainNode.gain.linearRampToValueAtTime(0, sound.end);
        } else {
          gainNode.gain.setValueAtTime(0, sound.end);
        }
      } else {
        gainNode.gain.setValueAtTime(targetVolume, sound.end);
        gainNode.gain.setValueAtTime(0, sound.end + 0.001);
      }
      
      // Schedule playback
      source.start(sound.start);
      source.stop(sound.end);
    }
    
    this.onProgress(25);
    
    // Render the mix
    const renderedBuffer = await offlineCtx.startRendering();
    this.onProgress(40);
    
    // Convert AudioBuffer to WAV
    const wavBytes = audioBufferToWav(renderedBuffer);
    this.onProgress(50);
    
    return wavBytes;
  }
  
  public async exportMP4(project: Project): Promise<string> {
    if (!project.image) {
      throw new Error("No image found in project.");
    }
    
    this.onProgress(5);
    const ffmpeg = await this.loadFFmpeg();
    
    // 1. Render Audio
    const wavBytes = await this.renderAudio(project);
    
    // 2. Fetch Image
    let imageBytes: Uint8Array;
    if (project.imageFile) {
       imageBytes = new Uint8Array(await project.imageFile.arrayBuffer());
    } else {
       const res = await fetch(project.image);
       imageBytes = new Uint8Array(await res.arrayBuffer());
    }
    
    // 3. Write files to FFmpeg FS
    const imgExt = project.imageFile?.name.split('.').pop() || 'jpg';
    const imgName = `image.${imgExt}`;
    await ffmpeg.writeFile(imgName, imageBytes);
    await ffmpeg.writeFile('audio.wav', wavBytes);
    
    // 4. Run FFmpeg command
    // Loop the single image, mix with audio, limit duration to project duration
    // Using libx264 for video and aac for audio.
    const durationStr = project.duration.toString();
    await ffmpeg.exec([
      '-loop', '1',
      '-i', imgName,
      '-i', 'audio.wav',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-t', durationStr,
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions for yuv420p
      '-shortest',
      'output.mp4'
    ]);
    
    // 5. Read output and create Blob URL
    const fileData = await ffmpeg.readFile('output.mp4');
    const data = fileData as Uint8Array;
    const blob = new Blob([data as any], { type: 'video/mp4' });
    
    return URL.createObjectURL(blob);
  }
}
