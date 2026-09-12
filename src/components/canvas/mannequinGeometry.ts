import * as THREE from 'three';

// ─── 1D Catmull-Rom Spline Evaluator ──────────────────────────────
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function evalSpline(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];

  let i = 0;
  while (i < keys.length - 1 && keys[i + 1][0] < t) i++;

  const k0 = keys[Math.max(0, i - 1)];
  const k1 = keys[i];
  const k2 = keys[Math.min(keys.length - 1, i + 1)];
  const k3 = keys[Math.min(keys.length - 1, i + 2)];

  const span = k2[0] - k1[0];
  const localT = span > 0 ? (t - k1[0]) / span : 0;
  return catmullRom(k0[1], k1[1], k2[1], k3[1], localT);
}

/**
 * Procedural Mannequin Bust Geometry:
 * Faithfully reproduces the anatomical display headform from the reference photo:
 * - 0° Frontal: Slender egg head, refined jawline tapering to rounded chin, slender swan neck, sculpted bust flare.
 * - 45° Three-Quarter: Defined jaw silhouette, smooth neck transition, sculpted display shoulder slope.
 * - 90° Profile: Deep cranial vault extending posteriorly, angled blank face plane, distinct chin,
 *   submental notch connecting to throat, cervical lordosis curve at nape, and sculpted chest slope.
 */
export function createMannequinGeometry(): THREE.BufferGeometry {
  // Height parameter t: 0.0 (flat base pedestal) -> 1.0 (crown apex)
  // Total vertical span: y = -1.45 to y = +1.62 (height = 3.07)
  const yKeys: [number, number][] = [
    [0.00, -1.45],
    [0.05, -1.35],
    [0.12, -1.15],
    [0.20, -0.90],
    [0.28, -0.65],
    [0.35, -0.45],
    [0.43, -0.20],
    [0.50,  0.02],
    [0.55,  0.15],
    [0.60,  0.30],
    [0.67,  0.50],
    [0.75,  0.75],
    [0.83,  1.00],
    [0.90,  1.20],
    [0.95,  1.42],
    [0.98,  1.55],
    [1.00,  1.62],
  ];

  // Front profile Z coordinate (facing -Z)
  const zfKeys: [number, number][] = [
    [0.00, -0.51], // base front edge
    [0.05, -0.53], // lower bust chest flare
    [0.12, -0.50], // mid bust
    [0.20, -0.42], // upper chest slope
    [0.28, -0.32], // clavicle / suprasternal notch
    [0.35, -0.25], // lower throat
    [0.43, -0.21], // mid throat
    [0.50, -0.20], // upper throat / submental junction
    [0.54, -0.29], // submental shelf under chin
    [0.59, -0.48], // chin tip prominence
    [0.67, -0.51], // lower face
    [0.75, -0.53], // mid face / cheek level
    [0.83, -0.52], // brow line
    [0.90, -0.48], // upper forehead
    [0.95, -0.36], // high forehead
    [0.98, -0.16], // upper dome
    [1.00,  0.08], // crown apex
  ];

  // Back profile Z coordinate (facing +Z)
  const zbKeys: [number, number][] = [
    [0.00,  0.52], // base back edge
    [0.05,  0.53], // lower back bust
    [0.12,  0.50], // mid back bust
    [0.20,  0.42], // upper back / thoracic spine
    [0.28,  0.35], // C7 cervical junction
    [0.35,  0.28], // lower nape
    [0.43,  0.24], // cervical nape hollow (inward curve)
    [0.50,  0.24], // mid nape
    [0.55,  0.26], // upper nape
    [0.60,  0.32], // nuchal line transition
    [0.67,  0.45], // lower occiput
    [0.75,  0.58], // mid occiput
    [0.83,  0.65], // cranium occiput maximum posterior projection
    [0.90,  0.63], // upper cranium vault
    [0.95,  0.52], // parietal dome
    [0.98,  0.30], // upper skull
    [1.00,  0.08], // crown apex
  ];

  // Lateral half-width in X (bilateral symmetry)
  const rxKeys: [number, number][] = [
    [0.00,  0.74], // base width
    [0.05,  0.75], // lower bust
    [0.12,  0.68], // mid bust display shoulder
    [0.20,  0.54], // shoulder slope
    [0.28,  0.38], // trapezius flare
    [0.35,  0.26], // lower neck
    [0.43,  0.22], // slender neck waist
    [0.50,  0.22], // upper neck
    [0.55,  0.24], // submandibular jaw
    [0.60,  0.30], // jaw angle width
    [0.67,  0.38], // lower cheek
    [0.75,  0.43], // mid cheek
    [0.83,  0.46], // brow / temple width
    [0.90,  0.47], // maximum head width at parietal bones
    [0.95,  0.40], // high skull
    [0.98,  0.25], // upper dome
    [1.00,  0.00], // apex
  ];

  const NY = 96;
  const NTHETA = 72;
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  for (let iy = 0; iy <= NY; iy++) {
    const t = iy / NY;
    const y = evalSpline(yKeys, t);
    const zf = evalSpline(zfKeys, t);
    const zb = evalSpline(zbKeys, t);
    const rx = evalSpline(rxKeys, t);

    const zmid = (zb + zf) / 2;
    const rzf = Math.max(0.001, zmid - zf);
    const rzb = Math.max(0.001, zb - zmid);

    for (let it = 0; it < NTHETA; it++) {
      const theta = (it / NTHETA) * Math.PI * 2;
      const u = Math.cos(theta); // lateral X component
      const v = Math.sin(theta); // sagittal Z component: v < 0 is front (-Z), v > 0 is back (+Z)

      let px: number;
      let pz: number;

      if (t >= 0.999) {
        // Crown apex tip
        px = 0;
        pz = zmid;
      } else if (v <= 0) {
        // Front hemisphere: Face, chin, throat, chest
        const frontFrac = -v; // 0 at lateral extremes (u = +/-1), 1 at center front (-Z)
        let chinTaper = 1.0;

        // Jaw / chin tapering: as we approach the chin tip from the jaw angles, taper X inward
        if (t >= 0.48 && t <= 0.66) {
          const jawPhase = Math.sin(((t - 0.48) / 0.18) * Math.PI);
          chinTaper = 1.0 - (0.46 * jawPhase * Math.pow(frontFrac, 1.25));
        }

        // Face plane soft flat/convex curvature matching stylized display mannequin
        let frontShape = frontFrac;
        if (t >= 0.66 && t <= 0.92) {
          const facePhase = Math.sin(((t - 0.66) / 0.26) * Math.PI);
          frontShape = Math.pow(frontFrac, 0.92 + 0.28 * facePhase);
        }

        px = rx * u * chinTaper;
        pz = zmid - rzf * frontShape;
      } else {
        // Back hemisphere: Cranium vault, nape, back bust
        const backFrac = v; // 0 at lateral extremes, 1 at center back (+Z)
        px = rx * u;
        pz = zmid + rzb * Math.pow(backFrac, 1.02);
      }

      vertices.push(px, y, pz);
      uvs.push(it / NTHETA, t);
    }
  }

  // Generate quad strip triangle indices
  for (let iy = 0; iy < NY; iy++) {
    for (let it = 0; it < NTHETA; it++) {
      const nextTheta = (it + 1) % NTHETA;
      const curRow = iy * NTHETA;
      const nextRow = (iy + 1) * NTHETA;

      const a = curRow + it;
      const b = curRow + nextTheta;
      const c = nextRow + nextTheta;
      const d = nextRow + it;

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  // Add flat bottom pedestal cap at base (iy = 0)
  const baseCenterIndex = vertices.length / 3;
  const baseT = 0;
  const baseY = evalSpline(yKeys, baseT);
  const baseZMid = (evalSpline(zbKeys, baseT) + evalSpline(zfKeys, baseT)) / 2;
  vertices.push(0, baseY, baseZMid);
  uvs.push(0.5, 0.5);

  for (let it = 0; it < NTHETA; it++) {
    const nextTheta = (it + 1) % NTHETA;
    // Bottom cap facing downwards (-Y)
    indices.push(baseCenterIndex, nextTheta, it);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates the complete production-grade mannequin bust mesh:
 * Matte white alabaster/porcelain studio finish with soft dielectric response.
 */
export function buildMannequinModel(): THREE.Group {
  const group = new THREE.Group();

  const geometry = createMannequinGeometry();

  // Luxurious studio matte white porcelain/fiberglass material matching the reference photo
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xfafbfd,
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.12,
    clearcoatRoughness: 0.35,
    reflectivity: 0.45,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Scale and position adjustment to sit naturally in the soundfield center
  mesh.scale.set(1.22, 1.22, 1.22);
  mesh.position.set(0, 0, 0);

  group.add(mesh);

  return group;
}
