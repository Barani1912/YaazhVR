'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { useEditorStore } from '@/store/projectStore';
import { buildMannequinModel } from './mannequinGeometry';
import styles from './SoundSphere3D.module.css';

const CAT_COLORS: Record<string, string> = {
  nature: '#10b981',
  city: '#06b6d4',
  objects: '#f59e0b',
  people: '#ec4899',
  temple: '#eab308',
  custom: '#8b5cf6',
};

type CameraPreset = 'perspective' | 'top' | 'front' | 'side' | 'inside';

interface SoundSphere3DProps {
  onExit3D: () => void;
}

export default function SoundSphere3D({ onExit3D }: SoundSphere3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const {
    project,
    selectedSoundId,
    isPlaying,
    setSelectedSound,
    isFullScale3D,
    setIsFullScale3D,
  } = useEditorStore();

  const [activePreset, setActivePreset] = useState<CameraPreset>('perspective');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hoveredSoundInfo, setHoveredSoundInfo] = useState<{
    name: string;
    category: string;
    x: number;
    y: number;
    z: number;
    dist: number;
    volume: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const soundNodesGroupRef = useRef<THREE.Group | null>(null);
  const waveRingsRef = useRef<THREE.Mesh[]>([]);

  // Reset full scale mode on unmount
  useEffect(() => {
    return () => {
      setIsFullScale3D(false);
    };
  }, [setIsFullScale3D]);

  // ─── Helper: Create Billboard Canvas Sprite for Label ──────────
  const createLabelSprite = useCallback((text: string, icon: string, color: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Rounded background pill
    ctx.fillStyle = 'rgba(6, 10, 20, 0.85)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 28);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text & Icon
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${icon} ${text}`, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2.4, 0.6, 1);
    return sprite;
  }, []);

  // ─── Helper: Create Geodesic Skeletal Sphere ────────────────────
  const buildSkeletalSphere = useCallback((radius: number): THREE.Group => {
    const group = new THREE.Group();

    // 1. Longitude Meridian Rings (Vertical circular circles around Y axis)
    const meridianCount = 16;
    const meridianMat = new THREE.LineBasicMaterial({
      color: 0x223654,
      transparent: true,
      opacity: 0.65,
    });

    const circleSegments = 72;
    for (let i = 0; i < meridianCount; i++) {
      const angle = (i * Math.PI) / meridianCount;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= circleSegments; j++) {
        const theta = (j / circleSegments) * Math.PI * 2;
        const x = Math.sin(theta) * radius * Math.cos(angle);
        const y = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius * Math.sin(angle);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, meridianMat);
      group.add(line);
    }

    // 2. Latitude Parallel Rings (Horizontal rings from South to North)
    const latAngles = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
    latAngles.forEach((latDeg) => {
      const latRad = (latDeg * Math.PI) / 180;
      const r = radius * Math.cos(latRad);
      const y = radius * Math.sin(latRad);
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= circleSegments; j++) {
        const theta = (j / circleSegments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
      }
      const isEquator = latDeg === 0;
      const latMat = new THREE.LineBasicMaterial({
        color: isEquator ? 0x38bdf8 : 0x1d304a,
        transparent: true,
        opacity: isEquator ? 0.95 : 0.5,
      });
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, latMat);
      group.add(line);
    });

    // 3. Equator Cardinal Direction Markers
    const createDirectionMarker = (text: string, pos: THREE.Vector3) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 40;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.roundRect(2, 2, 124, 36, 18);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 20);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(pos);
      sprite.scale.set(1.6, 0.5, 1);
      return sprite;
    };

    group.add(createDirectionMarker('FRONT 0°', new THREE.Vector3(0, 0, -radius * 1.08)));
    group.add(createDirectionMarker('RIGHT +90°', new THREE.Vector3(radius * 1.08, 0, 0)));
    group.add(createDirectionMarker('REAR 180°', new THREE.Vector3(0, 0, radius * 1.08)));
    group.add(createDirectionMarker('LEFT -90°', new THREE.Vector3(-radius * 1.08, 0, 0)));

    // 4. Subtle inner dark ambient sphere shell
    const innerGeo = new THREE.SphereGeometry(radius * 0.99, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x050814,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    group.add(new THREE.Mesh(innerGeo, innerMat));

    // 5. White Directional Arrow on top of the sphere pointing Front (-Z)
    const createTopFrontArrow = (): THREE.Group => {
      const arrowGroup = new THREE.Group();

      const whiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.12,
        metalness: 0.08,
        emissive: 0xffffff,
        emissiveIntensity: 0.45,
      });

      // Shaft: Thick solid white cylinder oriented along the Z-axis
      const shaftRadius = 0.16;
      const shaftLength = 2.2;
      const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 32);
      const shaft = new THREE.Mesh(shaftGeo, whiteMat);
      shaft.rotation.x = Math.PI / 2; // Lie along Z
      const shaftZ = 0.35;
      shaft.position.set(0, 0, shaftZ);
      arrowGroup.add(shaft);

      // Arrowhead: Crisp white cone pointing towards Front (-Z)
      const coneRadius = 0.44;
      const coneHeight = 1.1;
      const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 32);
      const cone = new THREE.Mesh(coneGeo, whiteMat);
      cone.rotation.x = -Math.PI / 2; // Point tip towards -Z (Front)
      cone.position.set(0, 0, shaftZ - shaftLength / 2 - coneHeight / 2);
      arrowGroup.add(cone);

      // Tail Cap: Smooth rounded hemisphere at the rear of the shaft
      const capGeo = new THREE.SphereGeometry(shaftRadius, 16, 16);
      const cap = new THREE.Mesh(capGeo, whiteMat);
      cap.position.set(0, 0, shaftZ + shaftLength / 2);
      arrowGroup.add(cap);

      // Mounting pivot pedestal bead connecting arrow to sphere's north pole
      const pivotGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const pivot = new THREE.Mesh(pivotGeo, whiteMat);
      pivot.position.set(0, -0.22, 0);
      arrowGroup.add(pivot);

      // Position right on top of the sphere (radius = 8)
      arrowGroup.position.set(0, radius + 0.28, 0);

      return arrowGroup;
    };

    group.add(createTopFrontArrow());

    return group;
  }, []);

  // ─── Main Three.js Scene Setup & Loop ──────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera (Elevated 3/4 frontal angle showing sphere apex & mannequin)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(12, 7.0, -15);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    renderer.domElement.className = styles.webglCanvas;

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 35;
    controls.minDistance = 1.5;
    controls.target.set(0, 0.1, 0);
    controlsRef.current = controls;

    // 4. Studio Lighting setup matching gallery reference photograph
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Front-top keylight for clean form illumination
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(8, 14, -12);
    scene.add(keyLight);

    // Subtle soft fill light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.0);
    fillLight.position.set(-10, 5, -8);
    scene.add(fillLight);

    // Spatial rim light accentuating cranial vault and shoulder contours against dark background
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(5, 12, 14);
    scene.add(rimLight);

    // 5. Add Celestial Starfield Particles (Smooth Glowing Circular Particles)
    const createCircularStarTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // Soft circular radial glow
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(186, 230, 253, 0.9)');
      gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 31, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    };

    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 18 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starTexture = createCircularStarTexture();
    const starMat = new THREE.PointsMaterial({
      map: starTexture,
      color: 0xbae6fd,
      size: 0.38,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 6. Build Skeletal Sphere (Radius = 8)
    const sphereRadius = 8;
    const sphereMesh = buildSkeletalSphere(sphereRadius);
    scene.add(sphereMesh);

    // 7. Add Center Parametric Mannequin Bust (matching reference photograph)
    const mannequinModel = buildMannequinModel();
    scene.add(mannequinModel);

    // 8. Sound Nodes Container Group
    const soundGroup = new THREE.Group();
    scene.add(soundGroup);
    soundNodesGroupRef.current = soundGroup;

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      // Animate pulsing wave rings around active sounds
      waveRingsRef.current.forEach((ringMesh, idx) => {
        const speed = 1.6;
        const phase = (elapsedTime * speed + idx * 0.4) % 1.5;
        const scale = 1 + phase * 2.2;
        ringMesh.scale.set(scale, scale, scale);
        const mat = ringMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.7 * (1 - phase / 1.5));
      });

      // Subtle breath rotation on starfield
      starPoints.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [buildSkeletalSphere]);

  // ─── Synchronize 3D Sound Source Nodes ─────────────────────────
  useEffect(() => {
    const soundGroup = soundNodesGroupRef.current;
    if (!soundGroup) return;

    // Clear previous sound children
    while (soundGroup.children.length > 0) {
      const child = soundGroup.children[0];
      soundGroup.remove(child);
    }
    waveRingsRef.current = [];

    const sounds = project.sounds;

    sounds.forEach((sound) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.userData = { soundId: sound.id, sound };

      // Map sound coordinates:
      // X = sound.x (left/right: -5 to +5)
      // Y = sound.y (elevation: -3 to +3)
      // Z = -sound.z (distance: 0 to 10 sitting in front of listener along -Z)
      // Scaled to fit comfortably inside sphere (radius 8)
      const posX = sound.x * 1.1;
      const posY = sound.y * 1.1;
      const posZ = -Math.max(1.2, sound.z * 1.1);

      nodeGroup.position.set(posX, posY, posZ);

      const colorHex = CAT_COLORS[sound.category] || '#38bdf8';
      const colorNum = new THREE.Color(colorHex).getHex();
      const isSelected = selectedSoundId === sound.id;

      // 1. Central glowing orb
      const orbGeo = new THREE.SphereGeometry(0.38, 24, 24);
      const orbMat = new THREE.MeshStandardMaterial({
        color: colorNum,
        emissive: colorNum,
        emissiveIntensity: isSelected ? 0.9 : 0.45,
        roughness: 0.15,
        metalness: 0.7,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.userData = { isSoundOrb: true, soundId: sound.id };
      nodeGroup.add(orbMesh);

      // 2. Selection halo ring
      if (isSelected) {
        const haloGeo = new THREE.RingGeometry(0.48, 0.58, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.lookAt(0, 7, 17); // Face toward default camera
        nodeGroup.add(halo);
      }

      // 3. Acoustic wave ripple sphere (animates when playing)
      if (isPlaying && !sound.muted) {
        const waveGeo = new THREE.RingGeometry(0.42, 0.48, 32);
        const waveMat = new THREE.MeshBasicMaterial({
          color: colorNum,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.lookAt(0, 0, 0); // Face listener center
        nodeGroup.add(waveMesh);
        waveRingsRef.current.push(waveMesh);
      }

      // 4. Acoustic tether line to center listener (0, 0, 0)
      const linePoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-posX, -posY, -posZ), // Relative from sound node back to origin
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineDashedMaterial({
        color: colorNum,
        dashSize: 0.4,
        gapSize: 0.2,
        transparent: true,
        opacity: isSelected ? 0.75 : 0.35,
      });
      const tether = new THREE.Line(lineGeo, lineMat);
      tether.computeLineDistances();
      nodeGroup.add(tether);

      // 5. Billboard Label Badge above the orb
      const labelSprite = createLabelSprite(sound.name, sound.icon, colorHex);
      labelSprite.position.set(0, 0.75, 0);
      nodeGroup.add(labelSprite);

      soundGroup.add(nodeGroup);
    });
  }, [project.sounds, selectedSoundId, isPlaying, createLabelSprite]);

  // ─── Interactive Mouse Raycasting (Click & Hover) ──────────────
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const soundGroup = soundNodesGroupRef.current;
    if (!container || !camera || !soundGroup) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const intersects = raycaster.intersectObjects(soundGroup.children, true);
    const hitOrb = intersects.find((hit) => hit.object.userData?.isSoundOrb);

    if (hitOrb) {
      const sId = hitOrb.object.userData.soundId;
      const sound = project.sounds.find((s) => s.id === sId);
      if (sound) {
        const dist = Math.sqrt(sound.x * sound.x + sound.y * sound.y + sound.z * sound.z);
        setHoveredSoundInfo({
          name: sound.name,
          category: sound.category,
          x: sound.x,
          y: sound.y,
          z: sound.z,
          dist: Math.round(dist * 10) / 10,
          volume: Math.round(sound.volume * 100),
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
        });
        container.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredSoundInfo(null);
    container.style.cursor = 'grab';
  }, [project.sounds]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const soundGroup = soundNodesGroupRef.current;
    if (!container || !camera || !soundGroup) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const intersects = raycaster.intersectObjects(soundGroup.children, true);
    const hitOrb = intersects.find((hit) => hit.object.userData?.isSoundOrb);

    if (hitOrb) {
      const sId = hitOrb.object.userData.soundId;
      setSelectedSound(sId);
    }
  }, [setSelectedSound]);

  // ─── Camera Preset Navigation with GSAP ─────────────────────────
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setActivePreset(preset);
    controls.autoRotate = false;
    setIsAutoRotating(false);

    let targetPos = new THREE.Vector3(12, 7.0, -15);
    let targetLook = new THREE.Vector3(0, 0.1, 0);

    switch (preset) {
      case 'perspective':
        targetPos = new THREE.Vector3(12, 7.0, -15);
        targetLook = new THREE.Vector3(0, 0.1, 0);
        break;
      case 'top':
        targetPos = new THREE.Vector3(0, 21, 0.001);
        targetLook = new THREE.Vector3(0, 0, 0);
        break;
      case 'front':
        targetPos = new THREE.Vector3(0, 0.8, -16);
        targetLook = new THREE.Vector3(0, 0.1, 0);
        break;
      case 'side':
        targetPos = new THREE.Vector3(16, 0.8, 0);
        targetLook = new THREE.Vector3(0, 0.1, 0);
        break;
      case 'inside':
        targetPos = new THREE.Vector3(0, 0.2, 0.1);
        targetLook = new THREE.Vector3(0, 0.2, -10);
        break;
    }

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    });

    gsap.to(controls.target, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    });
  }, []);

  const toggleAutoRotate = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const next = !isAutoRotating;
    controls.autoRotate = next;
    controls.autoRotateSpeed = 1.0;
    setIsAutoRotating(next);
  }, [isAutoRotating]);

  const handleExit3D = useCallback(() => {
    setIsFullScale3D(false);
    onExit3D();
  }, [setIsFullScale3D, onExit3D]);

  return (
    <div
      ref={mountRef}
      className={styles.sphereContainer}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      {/* ─── Floating Top HUD ──────────────────────────────────── */}
      <div className={styles.topHud}>
        <div className={styles.hudLeft}>
          <div className={styles.hudBadgeRow}>
            <div className={styles.hudBadge}>
              <span className={styles.pulseDot} />
              <span>3D SPATIAL SOUNDFIELD</span>
            </div>
            <span className={styles.hudMetaPill}>
              {project.sounds.length} Sound{project.sounds.length === 1 ? '' : 's'} Anchored
            </span>
          </div>
          <span className={styles.hudInstructionHint}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
            <span>Left-drag to rotate 360° • Scroll to zoom • Click sound to select</span>
          </span>
        </div>
      </div>

      {/* ─── Hovered Sound Tooltip ─────────────────────────────── */}
      {hoveredSoundInfo && (
        <div
          className={styles.soundTooltip}
          style={{
            left: `${hoveredSoundInfo.screenX}px`,
            top: `${hoveredSoundInfo.screenY}px`,
          }}
        >
          <div className={styles.tooltipTitleRow}>
            <span className={styles.tooltipName}>{hoveredSoundInfo.name}</span>
            <span className={styles.tooltipCategory}>{hoveredSoundInfo.category}</span>
          </div>
          <div className={styles.tooltipMetrics}>
            <div>Azimuth: <span>{hoveredSoundInfo.x > 0 ? `+${hoveredSoundInfo.x}m` : `${hoveredSoundInfo.x}m`}</span></div>
            <div>Distance: <span>{hoveredSoundInfo.dist}m</span></div>
            <div>Elevation: <span>{hoveredSoundInfo.y > 0 ? `+${hoveredSoundInfo.y}m` : `${hoveredSoundInfo.y}m`}</span></div>
            <div>Volume: <span>{hoveredSoundInfo.volume}%</span></div>
          </div>
        </div>
      )}

      {/* ─── Bottom Controls: Camera Presets & Exit 3D ─────────── */}
      <div className={styles.bottomControls}>
        {/* Preset angles */}
        <div className={styles.presetGroup}>
          <button
            className={`${styles.presetBtn} ${activePreset === 'perspective' ? styles.presetBtnActive : ''}`}
            onClick={() => applyCameraPreset('perspective')}
            title="3D Orbit Angle"
          >
            <span>3D Orbit</span>
          </button>
          <button
            className={`${styles.presetBtn} ${activePreset === 'top' ? styles.presetBtnActive : ''}`}
            onClick={() => applyCameraPreset('top')}
            title="Top View (Azimuth Map)"
          >
            <span>Top</span>
          </button>
          <button
            className={`${styles.presetBtn} ${activePreset === 'front' ? styles.presetBtnActive : ''}`}
            onClick={() => applyCameraPreset('front')}
            title="Front View (Facing Listener)"
          >
            <span>Front</span>
          </button>
          <button
            className={`${styles.presetBtn} ${activePreset === 'side' ? styles.presetBtnActive : ''}`}
            onClick={() => applyCameraPreset('side')}
            title="Side Ear Elevation"
          >
            <span>Side</span>
          </button>
          <button
            className={`${styles.presetBtn} ${activePreset === 'inside' ? styles.presetBtnActive : ''}`}
            onClick={() => applyCameraPreset('inside')}
            title="Listener Headphone Perspective"
          >
            <span>POV</span>
          </button>

          <div className={styles.presetDivider} />

          <button
            className={`${styles.presetBtn} ${isAutoRotating ? styles.presetBtnActive : ''}`}
            onClick={toggleAutoRotate}
            title={isAutoRotating ? 'Stop Turntable Rotation' : 'Auto Turntable Rotation'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{isAutoRotating ? 'Rotating' : 'Auto'}</span>
          </button>
        </div>

        {/* Viewport Mode Switcher (Bottom Right) */}
        <div className={styles.modeSwitcherGroup}>
          <button
            className={`${styles.fullScaleBtn} ${isFullScale3D ? styles.fullScaleBtnActive : ''}`}
            onClick={() => setIsFullScale3D(!isFullScale3D)}
            title={isFullScale3D ? 'Exit Full Scale (Show Sidebars & Timeline)' : 'Full Scale 3D Soundfield (Hide Sidebars & Timeline)'}
          >
            {isFullScale3D ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
                <span>Standard View</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
                <span>Full Scale</span>
              </>
            )}
          </button>

          <button
            className={styles.exit3dBtn}
            onClick={handleExit3D}
            title="Return to 2D Photo Canvas View"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>2D Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
