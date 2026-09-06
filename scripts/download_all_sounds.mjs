import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const soundsDir = path.join(rootDir, 'public', 'sounds');

// Helper to download with redirect follow
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    function get(currentUrl) {
      https.get(currentUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${currentUrl}: HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }
    get(url);
  });
}

// Fetch soundcn base64 sound
async function fetchSoundCn(name, destPath) {
  const url = `https://raw.githubusercontent.com/kapishdima/soundcn/main/registry/soundcn/sounds/${name}/${name}.ts`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try {
          const match = d.match(/data:audio\/mpeg;base64,([A-Za-z0-9+/=]+)/);
          if (match && match[1]) {
            const buf = Buffer.from(match[1], 'base64');
            fs.writeFileSync(destPath, buf);
            resolve();
          } else {
            reject(new Error(`No base64 audio found in ${name}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const SOUNDS = [
  // ─── Nature (10 sounds) ──────────────────────────
  {
    category: 'nature',
    id: 'birds',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/animals/birds.mp3'
  },
  {
    category: 'nature',
    id: 'heavy_rain',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/rain/heavy-rain.mp3'
  },
  {
    category: 'nature',
    id: 'light_rain',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/rain/light-rain.mp3'
  },
  {
    category: 'nature',
    id: 'thunder',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/rain/thunder.mp3'
  },
  {
    category: 'nature',
    id: 'wind',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/wind.mp3'
  },
  {
    category: 'nature',
    id: 'howling_wind',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/howling-wind.mp3'
  },
  {
    category: 'nature',
    id: 'river',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/river.mp3'
  },
  {
    category: 'nature',
    id: 'waterfall',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/waterfall.mp3'
  },
  {
    category: 'nature',
    id: 'ocean_waves',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/waves.mp3'
  },
  {
    category: 'nature',
    id: 'campfire',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/campfire.mp3'
  },

  // ─── City (10 sounds) ────────────────────────────
  {
    category: 'city',
    id: 'traffic',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/urban/traffic.mp3'
  },
  {
    category: 'city',
    id: 'busy_street',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/urban/busy-street.mp3'
  },
  {
    category: 'city',
    id: 'highway',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/urban/highway.mp3'
  },
  {
    category: 'city',
    id: 'car_horn',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/horn%20car.mp3'
  },
  {
    category: 'city',
    id: 'subway',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/places/subway-station.mp3'
  },
  {
    category: 'city',
    id: 'siren',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/urban/ambulance-siren.mp3'
  },
  {
    category: 'city',
    id: 'cafe',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/places/cafe.mp3'
  },
  {
    category: 'city',
    id: 'construction',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/places/construction-site.mp3'
  },
  {
    category: 'city',
    id: 'bicycle_bell',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/horn%20bicycle.mp3'
  },
  {
    category: 'city',
    id: 'crowd_city',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/urban/crowd.mp3'
  },

  // ─── Temple (10 sounds) ──────────────────────────
  {
    category: 'temple',
    id: 'temple_ambience',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/places/temple.mp3'
  },
  {
    category: 'temple',
    id: 'singing_bowl',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/singing-bowl.mp3'
  },
  {
    category: 'temple',
    id: 'wind_chimes',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/wind-chimes.mp3'
  },
  {
    category: 'temple',
    id: 'church_bells',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/places/church.mp3'
  },
  {
    category: 'temple',
    id: 'gong',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Attribution%20license/announcement%20gong.mp3'
  },
  {
    category: 'temple',
    id: 'temple_bell',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/ding%20bell.mp3'
  },
  {
    category: 'temple',
    id: 'meditation_bell',
    url: 'https://raw.githubusercontent.com/being-peace/meditation-timer/master/one%20ring%20bell.mp3'
  },
  {
    category: 'temple',
    id: 'three_bells',
    url: 'https://raw.githubusercontent.com/being-peace/meditation-timer/master/three%20ring%20bell.mp3'
  },
  {
    category: 'temple',
    id: 'droplets_sanctuary',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/droplets.mp3'
  },
  {
    category: 'temple',
    id: 'night_temple',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/animals/crickets.mp3'
  },

  // ─── People (10 sounds) ──────────────────────────
  {
    category: 'people',
    id: 'applause',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Attribution%20license/applause.mp3'
  },
  {
    category: 'people',
    id: 'cheering',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Attribution%20license/celebrate%20group%20applause%20clapping%20yey%201.mp3'
  },
  {
    category: 'people',
    id: 'laughter',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/laughter%20sitcom%20audience%20crowd.mp3'
  },
  {
    category: 'people',
    id: 'laughter_cute',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/laughter%20cute.mp3'
  },
  {
    category: 'people',
    id: 'gasp',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/shock%20gasp.mp3'
  },
  {
    category: 'people',
    id: 'footsteps_gravel',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/walk-on-gravel.mp3'
  },
  {
    category: 'people',
    id: 'footsteps_leaves',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/walk-on-leaves.mp3'
  },
  {
    category: 'people',
    id: 'footsteps_snow',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/nature/walk-in-snow.mp3'
  },
  {
    category: 'people',
    id: 'crowded_bar',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/places/crowded-bar.mp3'
  },
  {
    category: 'people',
    id: 'shush',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/quiet%20shush%20shh.mp3'
  },

  // ─── Objects (10 sounds) ─────────────────────────
  {
    category: 'objects',
    id: 'clock',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/clock.mp3'
  },
  {
    category: 'objects',
    id: 'keyboard',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/keyboard.mp3'
  },
  {
    category: 'objects',
    id: 'typewriter',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/typewriter.mp3'
  },
  {
    category: 'objects',
    id: 'paper',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/paper.mp3'
  },
  {
    category: 'objects',
    id: 'door_knock',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/knock%20door.mp3'
  },
  {
    category: 'objects',
    id: 'telephone',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/telephone%20rotary%20ring%20loop.mp3'
  },
  {
    category: 'objects',
    id: 'door_slam',
    url: 'https://raw.githubusercontent.com/jonjonsson/SoundMonster/master/Public%20domain/knock%20heavy.mp3'
  },
  {
    category: 'objects',
    id: 'vinyl',
    url: 'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/vinyl-effect.mp3'
  },
  {
    category: 'objects',
    id: 'camera',
    soundcn: 'book-flip-1'
  },
  {
    category: 'objects',
    id: 'coins',
    soundcn: 'coin-collect'
  }
];

async function main() {
  console.log(`Starting download of ${SOUNDS.length} real sounds...`);

  // Ensure directories exist
  for (const cat of ['nature', 'city', 'temple', 'people', 'objects']) {
    const dir = path.join(soundsDir, cat);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  let completed = 0;
  for (const sound of SOUNDS) {
    const dest = path.join(soundsDir, sound.category, `${sound.id}.mp3`);
    try {
      if (sound.soundcn) {
        await fetchSoundCn(sound.soundcn, dest);
      } else {
        await downloadFile(sound.url, dest);
      }
      completed++;
      const stat = fs.statSync(dest);
      console.log(`[${completed}/${SOUNDS.length}] Saved ${sound.category}/${sound.id}.mp3 (${stat.size} bytes)`);
    } catch (err) {
      console.error(`Failed ${sound.category}/${sound.id}:`, err.message);
    }
  }

  console.log(`\nFinished downloading ${completed}/${SOUNDS.length} sounds.`);
}

main().catch(console.error);
