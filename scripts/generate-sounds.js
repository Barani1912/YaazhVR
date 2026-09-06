// Generate placeholder audio files (sine wave tones) for each sound in the library.
// Each category gets a distinct base frequency so they sound different.
// Run: node scripts/generate-sounds.js

const fs = require('fs');
const path = require('path');

// WAV file generation
function generateWav(frequency, duration, sampleRate = 44100) {
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate sine wave samples with some variation
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Add harmonic richness
    let sample = 0;
    sample += 0.5 * Math.sin(2 * Math.PI * frequency * t);
    sample += 0.2 * Math.sin(2 * Math.PI * frequency * 2 * t);
    sample += 0.1 * Math.sin(2 * Math.PI * frequency * 3 * t);

    // Add slight amplitude modulation for organic feel
    const modulation = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t);
    sample *= modulation;

    // Fade in/out
    const fadeIn = Math.min(1, t / 0.1);
    const fadeOut = Math.min(1, (duration - t) / 0.2);
    sample *= fadeIn * fadeOut * 0.6;

    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

// Sound definitions with distinct frequencies
const sounds = {
  nature: {
    birds:     { freq: 1200, duration: 10 },
    wind:      { freq: 200,  duration: 10 },
    rain:      { freq: 800,  duration: 10 },
    waterfall: { freq: 400,  duration: 10 },
    river:     { freq: 300,  duration: 10 },
  },
  city: {
    traffic:   { freq: 150,  duration: 10 },
    crowd:     { freq: 500,  duration: 10 },
    metro:     { freq: 100,  duration: 10 },
  },
  temple: {
    bell:      { freq: 880,  duration: 10 },
    chanting:  { freq: 220,  duration: 10 },
  },
  people: {
    laugh:     { freq: 600,  duration: 10 },
    clap:      { freq: 1000, duration: 10 },
    footsteps: { freq: 180,  duration: 10 },
  },
  objects: {
    fire:      { freq: 350,  duration: 10 },
    camera:    { freq: 1500, duration: 10 },
    door:      { freq: 250,  duration: 10 },
  },
};

const publicDir = path.join(__dirname, '..', 'public', 'sounds');

Object.entries(sounds).forEach(([category, items]) => {
  const categoryDir = path.join(publicDir, category);
  fs.mkdirSync(categoryDir, { recursive: true });

  Object.entries(items).forEach(([name, config]) => {
    const filePath = path.join(categoryDir, `${name}.mp3`);
    // We'll save as .wav but name as .mp3 - browsers handle both
    // Actually let's save as .wav and update references
    const wavPath = path.join(categoryDir, `${name}.wav`);
    const wav = generateWav(config.freq, config.duration);
    fs.writeFileSync(wavPath, wav);
    // Also create an mp3 symlink/copy since library references .mp3
    fs.copyFileSync(wavPath, filePath);
    console.log(`✓ ${category}/${name}.mp3 (${config.freq}Hz, ${config.duration}s)`);
  });
});

console.log('\n✅ All placeholder sounds generated!');
