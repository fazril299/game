import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { soundEngine } from '../audio/soundEngine';

export default function SkyWorld({
  isNight,
  onDock,
  onUndock,
  dockedIsland,
  targetIsland,
  setTargetIsland,
  onFlightStats,
  showLabels = true
}) {
  const containerRef = useRef(null);
  const labelsContainerRef = useRef(null);
  const sceneRef = useRef(null);

  const isNightRef = useRef(isNight);
  useEffect(() => {
    isNightRef.current = isNight;
  }, [isNight]);

  const onDockRef = useRef(onDock);
  useEffect(() => {
    onDockRef.current = onDock;
  }, [onDock]);

  const onUndockRef = useRef(onUndock);
  useEffect(() => {
    onUndockRef.current = onUndock;
  }, [onUndock]);

  const onFlightStatsRef = useRef(onFlightStats);
  useEffect(() => {
    onFlightStatsRef.current = onFlightStats;
  }, [onFlightStats]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none;';
    container.appendChild(renderer.domElement);

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    sceneRef.current = { scene, renderer };

    const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.5, 2400);

    const c = (hex) => new THREE.Color(hex);
    const dayTheme = {
      zenith: c('#3f67c4'),
      horizon: c('#ffb886'),
      sun: c('#ffc27a'),
      fog: c('#f6c7a4'),
      cloudLit: c('#ffe2bf'),
      cloudShade: c('#a493c4'),
      sunI: 3.4,
      hemiI: 1.15,
      hemiSky: c('#ffe9d6'),
      hemiGround: c('#b9a2c9'),
      exposure: 1.08,
      stars: 0.0
    };

    const nightTheme = {
      zenith: c('#040a1e'),
      horizon: c('#1d2a4c'),
      sun: c('#9fb4ff'),
      fog: c('#17223e'),
      cloudLit: c('#7486c4'),
      cloudShade: c('#1b2547'),
      sunI: 0.75,
      hemiI: 0.55,
      hemiSky: c('#5a72c4'),
      hemiGround: c('#1a2244'),
      exposure: 0.95,
      stars: 1.0
    };

    scene.fog = new THREE.Fog(dayTheme.fog.clone(), 140, 760);

    const hemiLight = new THREE.HemisphereLight(dayTheme.hemiSky, dayTheme.hemiGround, dayTheme.hemiI);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, dayTheme.sunI);
    sunLight.position.set(180, 160, -280);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 50;
    sunLight.shadow.camera.far = 600;
    const shadowD = 160;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // --- Shaders ---
    // 1. Sky Dome Shader
    const skyUniforms = {
      uZenith: { value: dayTheme.zenith.clone() },
      uHorizon: { value: dayTheme.horizon.clone() },
      uSun: { value: dayTheme.sun.clone() },
      uSunDir: { value: new THREE.Vector3(0.42, 0.2, -0.88).normalize() },
      uStars: { value: 0.0 },
      uTime: { value: 0.0 }
    };

    const skyGeo = new THREE.SphereGeometry(1800, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: skyUniforms,
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith, uHorizon, uSun, uSunDir;
        uniform float uStars, uTime;
        varying vec3 vDir;

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        void main() {
          vec3 d = normalize(vDir);
          float y = clamp(d.y, -0.2, 1.0);
          float t = smoothstep(0.0, 0.5, y);
          t = t * t * (3.0 - 2.0 * t);
          vec3 col = mix(uHorizon, uZenith, t);
          col = mix(col, uHorizon * 0.92, smoothstep(0.0, -0.2, d.y));

          float s = max(dot(d, uSunDir), 0.0);
          col += uSun * (pow(s, 4.0) * 0.45 + pow(s, 48.0) * 0.7) * (1.0 - uStars * 0.6);
          col = mix(col, col * vec3(1.08, 0.96, 0.9), (1.0 - t) * 0.5 * (1.0 - uStars));
          col += uSun * smoothstep(0.9985, 0.9992, s) * 1.4;

          if (uStars > 0.0) {
            vec3 q = floor(d * 420.0);
            float st = step(0.9965, hash(q));
            float tw = 0.6 + 0.4 * sin(uTime * 2.0 + hash(q + 3.0) * 40.0);
            col += vec3(st * tw * uStars * smoothstep(0.02, 0.3, d.y));
          }

          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);

    // 2. Procedural Cloud Sea Shader
    const cloudUniforms = {
      uTime: skyUniforms.uTime,
      uLit: { value: dayTheme.cloudLit.clone() },
      uShade: { value: dayTheme.cloudShade.clone() },
      uFog: { value: dayTheme.fog.clone() },
      uSunDir: skyUniforms.uSunDir,
      uCam: { value: new THREE.Vector3() }
    };

    const cloudSeaGeo = new THREE.PlaneGeometry(3600, 3600, 1, 1);
    const cloudSeaMat = new THREE.ShaderMaterial({
      uniforms: cloudUniforms,
      fog: false,
      depthWrite: true,
      vertexShader: `
        varying vec3 vW;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uLit, uShade, uFog, uSunDir, uCam;
        varying vec3 vW;

        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
            mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float a = 0.5;
          float s = 0.0;
          for (int i = 0; i < 5; i++) {
            s += a * noise(p);
            p = p * 2.03 + vec2(1.7, 9.2);
            a *= 0.5;
          }
          return s;
        }

        void main() {
          vec2 p = vW.xz * 0.009 + vec2(uTime * 0.006, uTime * 0.0025);
          float c = fbm(p) + 0.5 * fbm(p * 2.7 - uTime * 0.01);
          float e = 0.06;
          float cx = fbm(p + vec2(e, 0.0)) - fbm(p - vec2(e, 0.0));
          float cz = fbm(p + vec2(0.0, e)) - fbm(p - vec2(0.0, e));
          vec3 nrm = normalize(vec3(-cx * 6.0, 1.0, -cz * 6.0));
          float l = clamp(dot(nrm, normalize(uSunDir + vec3(0.0, 0.4, 0.0))), 0.0, 1.0);
          vec3 col = mix(uShade, uLit, smoothstep(-0.35, 0.7, c * 0.9 + l * 0.6));
          col += uLit * pow(l, 6.0) * 0.22;
          col = mix(col, uShade * 0.85, smoothstep(0.15, -0.45, c) * 0.5);

          float d = length(vW.xz - uCam.xz);
          float f = smoothstep(220.0, 1100.0, d) * 0.85;
          col = mix(col, uFog, f);

          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    const cloudSeaMesh = new THREE.Mesh(cloudSeaGeo, cloudSeaMat);
    cloudSeaMesh.rotation.x = -Math.PI / 2;
    cloudSeaMesh.position.y = -18;
    scene.add(cloudSeaMesh);

    // Soft Radial Texture for Glow Sprites and Smoke
    const cloudTexCanvas = document.createElement('canvas');
    cloudTexCanvas.width = cloudTexCanvas.height = 64;
    const cctx = cloudTexCanvas.getContext('2d');
    const radG = cctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radG.addColorStop(0, 'rgba(255,255,255,1)');
    radG.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    radG.addColorStop(1, 'rgba(255,255,255,0)');
    cctx.fillStyle = radG;
    cctx.fillRect(0, 0, 64, 64);
    const cloudTex = new THREE.CanvasTexture(cloudTexCanvas);

    // Common Materials
    const matLib = {
      cream: new THREE.MeshStandardMaterial({ color: c('#f7f3ed'), roughness: 0.6 }),
      roof: new THREE.MeshStandardMaterial({ color: c('#c45d43'), roughness: 0.5 }),
      roofBlue: new THREE.MeshStandardMaterial({ color: c('#283593'), roughness: 0.4 }),
      stone: new THREE.MeshStandardMaterial({ color: c('#dcd8d0'), roughness: 0.8 }),
      white: new THREE.MeshStandardMaterial({ color: c('#ffffff'), roughness: 0.5 }),
      wood: new THREE.MeshStandardMaterial({ color: c('#b88b58'), roughness: 0.7 }),
      woodDark: new THREE.MeshStandardMaterial({ color: c('#64422b'), roughness: 0.8 }),
      metal: new THREE.MeshStandardMaterial({ color: c('#555d6e'), roughness: 0.4, metalness: 0.5 }),
      gold: new THREE.MeshStandardMaterial({ color: c('#d4a95c'), roughness: 0.35, metalness: 0.7 }),
      pine: new THREE.MeshStandardMaterial({ color: c('#3e6648'), roughness: 0.85 }),
      pine2: new THREE.MeshStandardMaterial({ color: c('#4d7752'), roughness: 0.85 }),
      leaf: new THREE.MeshStandardMaterial({ color: c('#6f9a52'), roughness: 0.85 }),
      leaf2: new THREE.MeshStandardMaterial({ color: c('#8fb35c'), roughness: 0.85 }),
      trunk: new THREE.MeshStandardMaterial({ color: c('#7a5643'), roughness: 0.9 }),
      flower: new THREE.MeshStandardMaterial({ color: c('#e9a3b5'), roughness: 0.8 }),
      rock: new THREE.MeshStandardMaterial({ color: c('#a69fb7'), roughness: 0.9 }),
      rockDark: new THREE.MeshStandardMaterial({ color: c('#7f7895'), roughness: 0.95 }),
      window: new THREE.MeshStandardMaterial({
        color: c('#2d3550'),
        emissive: c('#ffc77a'),
        emissiveIntensity: 0.05,
        roughness: 0.2
      }),
      lamp: new THREE.MeshStandardMaterial({
        color: c('#fff1c9'),
        emissive: c('#ffb45c'),
        emissiveIntensity: 0.2,
        roughness: 0.5
      }),
      candiStone: new THREE.MeshStandardMaterial({
        color: c('#6e6a74'),
        roughness: 0.88,
        flatShading: true
      }),
      candiStoneDark: new THREE.MeshStandardMaterial({
        color: c('#4d4952'),
        roughness: 0.92,
        flatShading: true
      }),
      candiStoneAccent: new THREE.MeshStandardMaterial({
        color: c('#8c8794'),
        roughness: 0.8,
        flatShading: true
      }),
      candiStoneWarm: new THREE.MeshStandardMaterial({
        color: c('#80786f'),
        roughness: 0.85,
        flatShading: true
      }),
      candiMoss: new THREE.MeshStandardMaterial({
        color: c('#57634d'),
        roughness: 0.92,
        flatShading: true
      }),
      poolWater: new THREE.MeshStandardMaterial({
        color: c('#1da8a4'),
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88
      }),
      malioboroGreen: new THREE.MeshStandardMaterial({
        color: c('#1a3d2e'),
        roughness: 0.45,
        metalness: 0.35
      }),
      pareanomGreen: new THREE.MeshStandardMaterial({
        color: c('#1b5e3a'),
        roughness: 0.45,
        metalness: 0.2
      }),
      royalRed: new THREE.MeshStandardMaterial({
        color: c('#991b1b'),
        roughness: 0.55
      }),
      keratonMarble: new THREE.MeshStandardMaterial({
        color: c('#fcfbf7'),
        roughness: 0.25,
        metalness: 0.05
      }),
      terracotta: new THREE.MeshStandardMaterial({
        color: c('#b85437'),
        roughness: 0.75
      }),
      keratonGold: new THREE.MeshStandardMaterial({
        color: c('#e5b741'),
        roughness: 0.3,
        metalness: 0.75
      }),
      sand: new THREE.MeshStandardMaterial({
        color: c('#d9be9b'),
        roughness: 0.95,
        flatShading: true
      }),
      limestone: new THREE.MeshStandardMaterial({
        color: c('#eae5dc'),
        roughness: 0.8,
        flatShading: true
      }),
      brickRed: new THREE.MeshStandardMaterial({
        color: c('#a84b33'),
        roughness: 0.85
      }),
      beacon: new THREE.MeshStandardMaterial({
        color: c('#FF4B1F'),
        emissive: c('#FF4B1F'),
        emissiveIntensity: 1.8,
        roughness: 0.3
      })
    };

    // Shared Geometries
    const geoLib = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
      cyl12: new THREE.CylinderGeometry(1, 1, 1, 12),
      cone7: new THREE.ConeGeometry(1, 1, 7),
      cone4: new THREE.ConeGeometry(1, 1, 4),
      ico: new THREE.IcosahedronGeometry(1, 0),
      dodec: new THREE.DodecahedronGeometry(1, 0),
      sph: new THREE.SphereGeometry(1, 12, 8),
      prism: (() => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.5, 0);
        shape.lineTo(0.5, 0);
        shape.lineTo(0, 0.6);
        shape.lineTo(-0.5, 0);
        const extr = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
        extr.translate(0, 0, -0.5);
        return extr;
      })()
    };

    const makeMesh = (geo, mat, sx, sy, sz, px = 0, py = 0, pz = 0, cast = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.scale.set(sx, sy, sz);
      m.castShadow = cast;
      m.receiveShadow = true;
      return m;
    };

    const glowingSprites = [];
    const makeGlow = (parent, x, y, z, size, colorHex) => {
      const spMat = new THREE.SpriteMaterial({
        map: cloudTex,
        color: c(colorHex),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.0
      });
      const sp = new THREE.Sprite(spMat);
      sp.position.set(x, y, z);
      sp.scale.setScalar(size);
      parent.add(sp);
      glowingSprites.push(sp);
      return sp;
    };

    const addTree = (parent, x, y, z, scale, isPine = false) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.scale.setScalar(scale);
      g.rotation.y = Math.random() * Math.PI * 2;
      g.add(makeMesh(geoLib.cyl6, matLib.trunk, 0.18, 1.1, 0.18, 0, 0.55, 0));
      if (isPine) {
        g.add(makeMesh(geoLib.cone7, matLib.pine, 0.95, 1.8, 0.95, 0, 1.7, 0));
        g.add(makeMesh(geoLib.cone7, matLib.pine2, 0.7, 1.4, 0.7, 0, 2.5, 0));
      } else {
        g.add(makeMesh(geoLib.ico, matLib.leaf, 1.05, 0.95, 1.05, 0, 1.75, 0));
        g.add(makeMesh(geoLib.ico, matLib.leaf2, 0.6, 0.6, 0.6, 0.45, 2.2, 0.2));
      }
      parent.add(g);
    };

    // Island Terrain Procedural Geometry with Low-Poly Facet Shading
    const islandTerrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.95
    });

    const buildIslandTerrain = (cfg) => {
      const pos = [];
      const cols = [];
      const shape = cfg.shape || 'oval';
      const slopeStyle = cfg.slopeStyle || (cfg.kind === 'parangtritis' ? 'desertButte' : 'grassy');

      // Surface palette
      let colTopA = c('#93b56b');
      let colTopB = c('#6c9455');
      let colTopC = null;
      let dirt = c('#8a5b44');
      let rock1 = c('#cdbfae');
      let rock2 = c('#a3958c');
      let rock3 = c('#756a72');

      if (cfg.surfaceColor && cfg.surfaceColor.length >= 2) {
        colTopA = c(cfg.surfaceColor[0]);
        colTopB = c(cfg.surfaceColor[1]);
        if (cfg.surfaceColor.length >= 3) {
          colTopC = c(cfg.surfaceColor[2]);
        }
      }

      if (slopeStyle === 'royalUrban') {
        dirt = c('#8a5b44');
        rock1 = c('#7a4d38');
        rock2 = c('#68504a');
        rock3 = c('#756a72');
      } else if (slopeStyle === 'andesiteCandi') {
        dirt = c('#6b6260');
        rock1 = c('#58504e');
        rock2 = c('#4a3d3a');
        rock3 = c('#3d3535');
      } else if (slopeStyle === 'limestoneMesa') {
        dirt = c('#d4c499');
        rock1 = c('#b8a57a');
        rock2 = c('#8a7050');
        rock3 = c('#4a3830');
      } else if (slopeStyle === 'grassyMoat') {
        dirt = c('#8a9e6a');
        rock1 = c('#7a8b60');
        rock2 = c('#7a7050');
        rock3 = c('#6a6060');
      } else if (slopeStyle === 'quarryCut') {
        dirt = c('#e8dcc0');
        rock1 = c('#c8ae80');
        rock2 = c('#8a6a40');
        rock3 = c('#5a4a35');
      } else if (slopeStyle === 'desertButte') {
        dirt = c('#c3944f');
        rock1 = c('#b2813e');
        rock2 = c('#976829');
        rock3 = c('#5a3515');
      } else if (slopeStyle === 'urbanConcrete') {
        dirt = c('#888070');
        rock1 = c('#7c7568');
        rock2 = c('#6c665a');
        rock3 = c('#606060');
      }

      const rings = [];
      const numRings = 7;
      const segs = 40;

      const getRadiusProfile = (a, ring) => {
        let rBase = cfg.r;
        let yDelta = 0;
        let isCliffDrop = false;

        if (shape === 'rectangular') {
          // Keraton: soft rounded square/rectangle
          const cosA = Math.abs(Math.cos(a));
          const sinA = Math.abs(Math.sin(a));
          const boxRatio = 1.0 / Math.pow(Math.pow(cosA, 4.5) + Math.pow(sinA, 4.5) + 0.02, 0.22);
          rBase = cfg.r * Math.min(1.22, boxRatio * 0.94);
        } else if (shape === 'triangular') {
          // Prambanan: 3-lobed shikhara triangle
          const lobe = Math.cos(3.0 * (a - 0.45));
          const triR = 1.0 + 0.38 * lobe + 0.08 * Math.cos(6.0 * a);
          rBase = cfg.r * triR * 0.92;
          if (ring === 0) yDelta = Math.max(0, lobe) * 0.45;
        } else if (shape === 'mesa') {
          // Ratu Boko: archaeological plateau with southwest sheer cliff
          const cliffAlign = Math.cos(a - (cfg.cliffSide || 3.4));
          const mesaNoise = 1.0 + 0.06 * Math.sin(a * 4.0 + cfg.seed);
          rBase = cfg.r * mesaNoise;
          if (cliffAlign > 0.1) {
            isCliffDrop = true;
          }
        } else if (shape === 'moat') {
          // Tamansari: circular island with subtle organic waves
          rBase = cfg.r * (1.0 + 0.06 * Math.sin(a * 2.0));
        } else if (shape === 'asymmetric') {
          // Tebing Breksi: extreme quarry cut on west
          const quarryAlign = Math.cos(a - (cfg.cliffSide || 2.9));
          rBase = cfg.r * (1.0 + 0.12 * Math.sin(a * 3.0 + cfg.seed));
          if (quarryAlign > 0.1) {
            isCliffDrop = true;
          }
        } else if (shape === 'butte') {
          // Gumuk Pasir: desert butte with sand tongue
          const tongue = Math.max(0, Math.cos(a - 1.57)) * 0.24;
          rBase = cfg.r * (1.05 + tongue + 0.05 * Math.sin(a * 3.0));
        } else if (shape === 'circular') {
          // Titik Nol: clean circular urban platform
          rBase = cfg.r;
        } else {
          // Default organic islet
          rBase = cfg.r * (1 + 0.08 * Math.sin(a * 3 + cfg.seed) + 0.05 * Math.sin(a * 5 + cfg.seed * 2.1));
        }

        return { rBase, yDelta, isCliffDrop };
      };

      // Barchan sand dune elevation profile for Gumuk Pasir
      const getDuneElevation = (x, z) => {
        // Main sweeping crescent ridge (barchan dune)
        const crescentDist = Math.hypot(x + 2.0, z - 1.0 + 0.04 * x * x);
        const dune1 = Math.max(0, 3.6 - Math.pow(crescentDist * 0.26, 1.7));
        // Secondary northeast shoulder ridge
        const dune2 = Math.max(0, 2.4 - Math.hypot(x - 5.0, z + 4.5) * 0.35);
        // Sandboarding slope dip & valley
        const valley = Math.sin(x * 0.25 - 0.5) * Math.cos(z * 0.28) * 0.8;
        // Subtle wind ripple ridges
        const ripples = 0.25 * Math.sin(x * 0.75 + z * 0.55);
        return dune1 + dune2 + valley + ripples;
      };

      for (let ring = 0; ring <= numRings; ring++) {
        const ringPts = [];
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2;
          const { rBase, yDelta, isCliffDrop } = getRadiusProfile(a, ring);
          let radius = rBase;
          let y = cfg.top;

          if (ring === 0) {
            y = cfg.top + yDelta;
            if (shape === 'butte') {
              const dx = Math.cos(a) * radius;
              const dz = Math.sin(a) * radius;
              y = cfg.top + getDuneElevation(dx, dz) * 0.55;
            }
          } else if (ring === 1) {
            if (shape === 'circular') {
              radius = rBase * 0.99;
              y = cfg.top - 0.7;
            } else if (shape === 'butte') {
              radius = rBase * 0.97;
              y = rings[0][s][1] - 0.9;
            } else {
              radius = rBase * 0.96;
              y = cfg.top - 1.1;
            }
          } else {
            const taper = (ring - 1) / (numRings - 1);
            if (isCliffDrop && taper < 0.65) {
              radius = rBase * (0.96 - taper * 0.06);
              y = cfg.top - 1.1 - taper * cfg.depth * 1.1;
            } else {
              radius = rBase * Math.max(0.05, 1.0 - Math.pow(taper, 0.85) * 0.92);
              y = cfg.top - 1.1 - taper * cfg.depth;
            }
          }
          ringPts.push([Math.cos(a) * radius, y, Math.sin(a) * radius]);
        }
        rings.push(ringPts);
      }

      const addTri = (p1, p2, p3, color) => {
        pos.push(...p1, ...p2, ...p3);
        cols.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
      };

      // Top plateau
      if (shape === 'butte') {
        // Gumuk Pasir: Genuine continuous sculpted low-poly Barchan sand dune
        const topRings = 5;
        const duneRings = [];
        const centerElev = getDuneElevation(0, 0);
        const centerPt = [0, cfg.top + centerElev, 0];

        for (let tr = 1; tr <= topRings; tr++) {
          const tRatio = tr / topRings;
          const pts = [];
          for (let s = 0; s < segs; s++) {
            const outerPt = rings[0][s];
            const px = outerPt[0] * tRatio;
            const pz = outerPt[2] * tRatio;
            const duneY = cfg.top + getDuneElevation(px, pz) * (1.0 - tRatio * 0.45);
            pts.push([px, tr === topRings ? outerPt[1] : duneY, pz]);
          }
          duneRings.push(pts);
        }

        // Center fan to first dune ring
        for (let s = 0; s < segs; s++) {
          const next = (s + 1) % segs;
          const p1 = duneRings[0][s];
          const p2 = duneRings[0][next];
          const avgY = (centerPt[1] + p1[1] + p2[1]) / 3 - cfg.top;
          const col = avgY > 2.0 ? colTopA : (avgY > 1.0 ? colTopB : (colTopC || colTopB));
          addTri(centerPt, p2, p1, col);
        }

        // Concentric bands across the barchan dunes
        for (let tr = 0; tr < topRings - 1; tr++) {
          const rInner = duneRings[tr];
          const rOuter = duneRings[tr + 1];
          for (let s = 0; s < segs; s++) {
            const next = (s + 1) % segs;
            const avgY = (rInner[s][1] + rOuter[s][1] + rOuter[next][1]) / 3 - cfg.top;
            const col = avgY > 2.2 ? colTopA : (avgY > 1.1 ? colTopB : (colTopC || colTopB));
            addTri(rInner[s], rOuter[next], rOuter[s], col);
            addTri(rInner[s], rInner[next], rOuter[next], col);
          }
        }
      } else {
        const center = [0, cfg.top + 0.8, 0];
        const topRing = rings[0];
        for (let s = 0; s < segs; s++) {
          const next = (s + 1) % segs;
          let col = Math.random() > 0.5 ? colTopA : colTopB;
          if (colTopC && Math.random() > 0.65) {
            col = colTopC;
          }
          if (shape === 'circular') {
            const midX = (topRing[s][0] + topRing[next][0]) * 0.5;
            const midZ = (topRing[s][2] + topRing[next][2]) * 0.5;
            col = (Math.floor(midX * 0.6) + Math.floor(midZ * 0.6)) % 2 === 0 ? colTopA : colTopB;
          }
          addTri(center, topRing[next], topRing[s], col);
        }
      }

      // Slopes
      for (let r = 0; r < numRings; r++) {
        const r1 = rings[r];
        const r2 = rings[r + 1];
        for (let s = 0; s < segs; s++) {
          const next = (s + 1) % segs;
          const depthRatio = r / numRings;
          let slopeCol = dirt;
          if (r > 1) {
            slopeCol = depthRatio < 0.5 ? rock1.clone().lerp(rock2, depthRatio * 2) : rock2.clone().lerp(rock3, (depthRatio - 0.5) * 2);
          }
          addTri(r1[s], r2[next], r2[s], slopeCol);
          addTri(r1[s], r1[next], r2[next], slopeCol);
        }
      }

      // Bottom crag cap
      const bottom = [0, cfg.top - cfg.depth * 1.15, 0];
      const botRing = rings[numRings];
      for (let s = 0; s < segs; s++) {
        const next = (s + 1) % segs;
        addTri(botRing[s], botRing[next], bottom, rock3);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      geo.computeVertexNormals();
      return geo;
    };


    // Island definitions (7 Iconic Yogyakarta Heritage Destinations with Unique Shapes)
    const islandsList = [
      {
        id: 'about',
        label: 'Keraton',
        title: 'Sumbu Filosofi',
        x: -58,
        z: -12,
        r: 16.5,
        top: 12.5,
        depth: 20,
        seed: 1.7,
        kind: 'studio',
        dock: -0.6,
        shape: 'rectangular',
        surfaceColor: ['#8eb56a', '#7a9e5e'],
        slopeStyle: 'royalUrban'
      },
      {
        id: 'work',
        label: 'Prambanan',
        title: 'Candi Prambanan',
        x: 66,
        z: -22,
        r: 18.5,
        top: 12.5,
        depth: 22,
        seed: 4.8,
        kind: 'gallery',
        dock: 3.6,
        shape: 'triangular',
        surfaceColor: ['#9aba6e', '#80a359'],
        slopeStyle: 'andesiteCandi'
      },
      {
        id: 'ratuboko',
        label: 'Ratu Boko',
        title: 'Candi Ratu Boko',
        x: 95,
        z: -90,
        r: 16,
        top: 12.5,
        depth: 20,
        seed: 12.3,
        kind: 'ratuboko',
        dock: 2.8,
        shape: 'mesa',
        hasCliff: true,
        cliffSide: 3.4,
        surfaceColor: ['#b8a878', '#94845c'],
        slopeStyle: 'limestoneMesa'
      },
      {
        id: 'journal',
        label: 'Tamansari',
        title: 'Istana Air',
        x: -24,
        z: -78,
        r: 15.5,
        top: 12.5,
        depth: 18,
        seed: 7.9,
        kind: 'library',
        dock: 1.9,
        shape: 'moat',
        surfaceColor: ['#7aab62', '#6b9c54'],
        slopeStyle: 'grassyMoat'
      },
      {
        id: 'breksi',
        label: 'Breksi & Mangunan',
        title: 'Tebing Breksi',
        x: 0,
        z: -160,
        r: 16,
        top: 12.5,
        depth: 20,
        seed: 18.9,
        kind: 'breksi',
        dock: 1.5,
        shape: 'asymmetric',
        hasCliff: true,
        cliffSide: 2.9,
        surfaceColor: ['#c8b88a', '#8a7a5a'],
        slopeStyle: 'quarryCut'
      },
      {
        id: 'parangtritis',
        label: 'Parangtritis',
        title: 'Gumuk Pasir',
        x: -85,
        z: -120,
        r: 16.5,
        top: 12.5,
        depth: 19,
        seed: 15.6,
        kind: 'parangtritis',
        dock: 0.8,
        shape: 'butte',
        surfaceColor: ['#fbeebe', '#ebd08d', '#d4a95c'],
        slopeStyle: 'desertButte'
      },
      {
        id: 'contact',
        label: 'Titik Nol',
        title: 'Tugu & Titik Nol',
        x: 34,
        z: -100,
        r: 13.5,
        top: 12.5,
        depth: 17,
        seed: 10.2,
        kind: 'beacon',
        dock: 1.6,
        shape: 'circular',
        surfaceColor: ['#b0a898', '#c8bfb0'],
        slopeStyle: 'urbanConcrete'
      }
    ];

    // Village & Warung Materials for Floating Islets (Pedesaan & Warung Warga Jogja)
    const matBlueTarp = new THREE.MeshStandardMaterial({ color: c('#0284c7'), roughness: 0.6, side: THREE.DoubleSide });
    const matOrangeTarp = new THREE.MeshStandardMaterial({ color: c('#ea580c'), roughness: 0.6, side: THREE.DoubleSide });
    const matZinc = new THREE.MeshStandardMaterial({ color: c('#94a3b8'), roughness: 0.5, metalness: 0.35 });
    const matBanana = new THREE.MeshStandardMaterial({ color: c('#84cc16'), roughness: 0.7, side: THREE.DoubleSide });
    const matGedek = new THREE.MeshStandardMaterial({ color: c('#d4b886'), roughness: 0.85 });
    const matCrackerTin = new THREE.MeshStandardMaterial({ color: c('#2563eb'), roughness: 0.4, metalness: 0.5 });

    // Helper: Rumah Warga Kampung Jawa Tradisional
    const makeVillageHouse = (parent, x, y, z, cfg = {}) => {
      const {
        w = 3.2, h = 2.0, d = 2.4,
        wallMat = matLib.wood,
        roofMat = matLib.terracotta,
        hasPorch = true,
        rotY = 0
      } = cfg;

      const house = new THREE.Group();
      house.position.set(x, y, z);
      house.rotation.y = rotY;

      // Stone foundation plinth (Batur pondasi batu)
      house.add(makeMesh(geoLib.box, matLib.stone, w + 0.4, 0.25, d + 0.4, 0, 0.12, 0));

      // House walls (Dinding kayu / anyaman gedek)
      house.add(makeMesh(geoLib.box, wallMat, w, h, d, 0, 0.25 + h * 0.5, 0));

      // Door & Window with warm ambient light
      house.add(makeMesh(geoLib.box, matLib.woodDark, 0.75, 1.4, 0.1, -0.6, 0.95, d * 0.5 + 0.05));
      const win = makeMesh(geoLib.box, matLib.window, 0.7, 0.7, 0.1, 0.7, 1.3, d * 0.5 + 0.05);
      house.add(win);

      // Limasan / Kampung Roof
      const roof = makeMesh(geoLib.prism, roofMat, w + 0.8, 1.2, d + 0.8, 0, 0.25 + h + 0.5, 0);
      roof.rotation.y = Math.PI / 2;
      house.add(roof);
      // Genteng mustaka finial
      house.add(makeMesh(geoLib.box, matLib.terracotta, 0.2, 0.35, 0.2, 0, 0.25 + h + 1.2, 0));

      // Front Porch (Emperan Teras) with Timber Posts and Bamboo Bench (Lincak)
      if (hasPorch) {
        const porchD = 1.4;
        const porchZ = d * 0.5 + porchD * 0.5;
        // Porch floor
        house.add(makeMesh(geoLib.box, matLib.stone, w + 0.4, 0.2, porchD, 0, 0.1, porchZ));
        // Porch posts
        house.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.07, 1.7, 0.07, -w * 0.45, 0.95, d * 0.5 + porchD - 0.1));
        house.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.07, 1.7, 0.07, w * 0.45, 0.95, d * 0.5 + porchD - 0.1));
        // Lean-to porch awning
        const porchAwning = makeMesh(geoLib.box, roofMat, w + 0.6, 0.08, porchD + 0.2, 0, 1.85, porchZ);
        porchAwning.rotation.x = 0.2;
        house.add(porchAwning);
        // Lincak Bambu (Bamboo Daybed Bench)
        house.add(makeMesh(geoLib.box, matLib.wood, 1.4, 0.08, 0.55, 0.3, 0.45, porchZ));
        house.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 0.35, 0.04, -0.3, 0.25, porchZ - 0.2));
        house.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 0.35, 0.04, 0.9, 0.25, porchZ - 0.2));
        house.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 0.35, 0.04, -0.3, 0.25, porchZ + 0.2));
        house.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 0.35, 0.04, 0.9, 0.25, porchZ + 0.2));
        // Warm teplok porch light
        house.add(makeMesh(geoLib.sph, matLib.lamp, 0.12, 0.16, 0.12, -w * 0.3, 1.7, d * 0.5 + 0.2, false));
        makeGlow(house, -w * 0.3, 1.7, d * 0.5 + 0.2, 2.5, '#ffb85c');
      }

      parent.add(house);
      return house;
    };

    // Helper: Warung Kopi & Angkringan Desa Pinggir Langit
    const makeWarungKopi = (parent, x, y, z, cfg = {}) => {
      const { tarpMat = matBlueTarp, rotY = 0 } = cfg;
      const warung = new THREE.Group();
      warung.position.set(x, y, z);
      warung.rotation.y = rotY;

      // Wooden counter & back wall
      warung.add(makeMesh(geoLib.box, matLib.wood, 2.8, 1.8, 1.8, 0, 0.9, 0));
      // Open window service opening
      warung.add(makeMesh(geoLib.box, matLib.woodDark, 1.8, 0.85, 0.2, 0, 1.15, 0.92));
      // Front serving counter ledge
      warung.add(makeMesh(geoLib.box, matLib.wood, 2.4, 0.08, 0.45, 0, 0.76, 1.15));

      // Iconic Tenda Terpal Warung (Slanted Blue/Orange Tarp Awning on Timber Poles)
      const tarp = makeMesh(geoLib.box, tarpMat, 3.2, 0.06, 1.8, 0, 2.05, 1.05);
      tarp.rotation.x = 0.28;
      warung.add(tarp);
      // Two front bamboo support poles
      warung.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.8, 0.04, -1.3, 0.9, 1.85));
      warung.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.8, 0.04, 1.3, 0.9, 1.85));

      // Lincak / Long Customer Bench
      warung.add(makeMesh(geoLib.box, matLib.wood, 2.2, 0.08, 0.35, 0, 0.42, 1.75));
      warung.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 0.38, 0.04, -0.9, 0.2, 1.75));
      warung.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 0.38, 0.04, 0.9, 0.2, 1.75));

      // Kaleng Kerupuk Biru (Classic Blue Square Cracker Tin with Glass Window)
      warung.add(makeMesh(geoLib.box, matCrackerTin, 0.26, 0.38, 0.26, 0.75, 0.98, 1.15));
      warung.add(makeMesh(geoLib.box, matLib.white, 0.18, 0.22, 0.02, 0.75, 0.98, 1.29)); // Glass pane

      // Ceret Seng Kopi Jos (Kettle)
      warung.add(makeMesh(geoLib.cyl12, matZinc, 0.15, 0.24, 0.15, -0.65, 0.92, 1.15));
      warung.add(makeMesh(geoLib.cone4, matZinc, 0.06, 0.18, 0.06, -0.65, 1.08, 1.15));

      // Hanging Teplok Lantern
      warung.add(makeMesh(geoLib.sph, matLib.lamp, 0.12, 0.18, 0.12, 0, 1.9, 1.05, false));
      makeGlow(warung, 0, 1.9, 1.05, 2.8, '#ffb85c');

      parent.add(warung);
      return warung;
    };

    // Helper: Pohon Pisang Pedesaan (Broad Arching Banana Leaves)
    const makePohonPisang = (parent, x, y, z, pScale = 1.0) => {
      const pisang = new THREE.Group();
      pisang.position.set(x, y, z);
      pisang.scale.setScalar(pScale);

      // Light green pseudo-stem trunk
      pisang.add(makeMesh(geoLib.cyl6, matBanana, 0.16, 2.2, 0.14, 0, 1.1, 0));

      // 5 Arching Broad Banana Leaves
      for (let l = 0; l < 5; l++) {
        const leafGroup = new THREE.Group();
        leafGroup.position.set(0, 2.1, 0);
        leafGroup.rotation.y = (l / 5) * Math.PI * 2 + (l % 2) * 0.3;
        leafGroup.rotation.z = 0.55 + (l % 2) * 0.15;

        // Broad flat leaf blade
        const blade = makeMesh(geoLib.box, matBanana, 0.45, 0.04, 1.8, 0, 0, 0.9);
        blade.rotation.x = -0.15;
        leafGroup.add(blade);
        pisang.add(leafGroup);
      }

      parent.add(pisang);
      return pisang;
    };

    // Helper: Pohon Kelapa Pedesaan
    const makePohonKelapa = (parent, x, y, z, pScale = 1.0, lean = 0.35) => {
      const kelapa = new THREE.Group();
      kelapa.position.set(x, y, z);
      kelapa.scale.setScalar(pScale);

      // Curved segmented trunk
      const t1 = makeMesh(geoLib.cyl6, matLib.woodDark, 0.18, 1.6, 0.16, 0, 0.8, 0);
      t1.rotation.z = lean * 0.3;
      const t2 = makeMesh(geoLib.cyl6, matLib.woodDark, 0.14, 1.5, 0.12, lean * 0.35, 2.2, 0);
      t2.rotation.z = lean * 0.7;
      kelapa.add(t1, t2);

      // Crown of Drooping Fronds
      const crownX = lean * 0.75;
      const crownY = 3.2;
      for (let f = 0; f < 6; f++) {
        const frond = new THREE.Group();
        frond.position.set(crownX, crownY, 0);
        frond.rotation.y = (f / 6) * Math.PI * 2;
        frond.rotation.z = 0.65;
        frond.add(makeMesh(geoLib.box, matLib.leaf, 0.3, 0.04, 2.2, 0, 0, 1.0));
        kelapa.add(frond);
      }

      // 3 Mini Green Coconuts
      for (let cIdx = 0; cIdx < 3; cIdx++) {
        const ca = (cIdx / 3) * Math.PI * 2;
        kelapa.add(makeMesh(geoLib.sph, matBanana, 0.14, 0.16, 0.14, crownX + Math.cos(ca) * 0.22, crownY - 0.15, Math.sin(ca) * 0.22));
      }

      parent.add(kelapa);
      return kelapa;
    };

    // Helper: Tali Jemuran Baju & Kain Batik Warga
    const makeJemuranBaju = (parent, x, y, z, rotY = 0) => {
      const jemuran = new THREE.Group();
      jemuran.position.set(x, y, z);
      jemuran.rotation.y = rotY;

      // Two wooden T-posts
      [[-1.2, 0], [1.2, 0]].forEach(([px, pz]) => {
        jemuran.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.6, 0.04, px, 0.8, pz));
        const bar = makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 0.6, 0.04, px, 1.55, pz);
        bar.rotation.x = Math.PI / 2;
        jemuran.add(bar);
      });

      // Clothesline wire
      const wire = makeMesh(geoLib.cyl6, matLib.metal, 0.015, 2.4, 0.015, 0, 1.55, 0);
      wire.rotation.z = Math.PI / 2;
      jemuran.add(wire);

      // Hanging Colorful Laundry Cloths (Batik & Baju Jemuran)
      const clothColors = ['#ef4444', '#3b82f6', '#f59e0b', '#ffffff'];
      clothColors.forEach((col, ci) => {
        const cMat = new THREE.MeshStandardMaterial({ color: c(col), roughness: 0.8, side: THREE.DoubleSide });
        const cloth = makeMesh(geoLib.box, cMat, 0.42, 0.55, 0.03, -0.75 + ci * 0.5, 1.25, 0);
        cloth.rotation.z = (Math.sin(ci) * 0.08);
        jemuran.add(cloth);
      });

      parent.add(jemuran);
      return jemuran;
    };

    // Helper: Sepeda Onthel Tua Bersandar di Dinding
    const makeSepedaOnthel = (parent, x, y, z, rotY = 0) => {
      const sepeda = new THREE.Group();
      sepeda.position.set(x, y, z);
      sepeda.rotation.y = rotY;
      sepeda.rotation.z = -0.15; // Leaning against wall

      // 2 Large Thin Spoke Wheels
      [-0.45, 0.45].forEach((wx) => {
        const wheel = makeMesh(geoLib.cyl12, matLib.woodDark, 0.28, 0.04, 0.28, wx, 0.28, 0);
        wheel.rotation.z = Math.PI / 2;
        sepeda.add(wheel);
      });
      // Frame bar
      const frame1 = makeMesh(geoLib.cyl6, matLib.metal, 0.02, 0.9, 0.02, 0, 0.4, 0);
      frame1.rotation.z = Math.PI / 2;
      sepeda.add(frame1);
      // Handlebars
      sepeda.add(makeMesh(geoLib.box, matLib.metal, 0.04, 0.15, 0.35, 0.35, 0.65, 0));
      // Saddle
      sepeda.add(makeMesh(geoLib.box, matLib.woodDark, 0.16, 0.05, 0.12, -0.1, 0.58, 0));

      parent.add(sepeda);
      return sepeda;
    };

    // Helper: Pos Ronda / Gardu Kamling Desa
    const makePosRonda = (parent, x, y, z, rotY = 0) => {
      const pos = new THREE.Group();
      pos.position.set(x, y, z);
      pos.rotation.y = rotY;

      // Stilt posts
      [[-1.0, -1.0], [1.0, -1.0], [-1.0, 1.0], [1.0, 1.0]].forEach(([px, pz]) => {
        pos.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.06, 1.8, 0.06, px, 0.9, pz));
      });
      // Bamboo raised floor
      pos.add(makeMesh(geoLib.box, matLib.wood, 2.4, 0.12, 2.4, 0, 0.5, 0));
      // Low rail
      pos.add(makeMesh(geoLib.box, matLib.woodDark, 2.4, 0.35, 0.06, 0, 0.8, -1.0));
      pos.add(makeMesh(geoLib.box, matLib.woodDark, 0.06, 0.35, 2.4, -1.0, 0.8, 0));

      // Limasan Tile / Thatch Roof
      const roof = makeMesh(geoLib.prism, matLib.terracotta, 2.8, 1.0, 2.8, 0, 2.1, 0);
      roof.rotation.y = Math.PI / 2;
      pos.add(roof);

      // Kentongan Kayu Raksasa Gantung (Slit Drum with Beater)
      const kentongan = makeMesh(geoLib.cyl6, matLib.woodDark, 0.14, 0.85, 0.14, 0.65, 1.2, 0.8);
      pos.add(kentongan);
      pos.add(makeMesh(geoLib.cyl6, matLib.wood, 0.03, 0.4, 0.03, 0.45, 1.1, 0.8));

      // Bendera Merah Putih Mini di Tiang Bambu
      const flagPole = new THREE.Group();
      flagPole.position.set(-1.15, 0.5, 1.15);
      flagPole.add(makeMesh(geoLib.cyl6, matLib.wood, 0.03, 2.8, 0.03, 0, 1.4, 0));
      flagPole.add(makeMesh(geoLib.box, matLib.royalRed, 0.02, 0.25, 0.45, 0.03, 2.65, 0.2));
      flagPole.add(makeMesh(geoLib.box, matLib.white, 0.02, 0.25, 0.45, 0.03, 2.4, 0.2));
      pos.add(flagPole);

      // Hanging Teplok Lantern
      pos.add(makeMesh(geoLib.sph, matLib.lamp, 0.12, 0.16, 0.12, 0, 1.5, 0, false));
      makeGlow(pos, 0, 1.5, 0, 2.8, '#ffcc77');

      parent.add(pos);
      return pos;
    };

    // Decorative islets: Kampung Warga & Warung-Warung Apung Tradisional Jogja
    const islets = [
      [-110, 30, 6], [-95, -60, 5], [10, -50, 4.5], [-40, 50, 5.5],
      [110, 25, 6], [98, -80, 5], [-65, -135, 7], [70, -150, 6.5]
    ];
    islets.forEach(([ix, iz, ir], idx) => {
      const isletMesh = new THREE.Mesh(
        buildIslandTerrain({ r: ir, top: 8 + (idx % 3) * 2, depth: ir * 1.3, seed: 20 + idx }),
        islandTerrainMat
      );
      isletMesh.position.set(ix, 0, iz);
      isletMesh.castShadow = true;
      isletMesh.receiveShadow = true;
      scene.add(isletMesh);

      const topH = 8 + (idx % 3) * 2 + 0.8;

      if (idx === 0) {
        // Islet 0: Rumah Limasan Kampung Jawa & Jemuran Pakaian Warga
        makeVillageHouse(isletMesh, -0.5, topH, -0.5, { w: 3.6, h: 2.1, d: 2.8, wallMat: matLib.wood, roofMat: matLib.terracotta, hasPorch: true, rotY: 0.3 });
        makeJemuranBaju(isletMesh, 1.8, topH, 1.4, -0.4);
        makePohonPisang(isletMesh, -2.2, topH, 1.6, 1.1);
        makePohonPisang(isletMesh, -1.6, topH, 2.4, 0.85);
        addTree(isletMesh, 2.2, topH, -1.8, 0.85, false);
      } else if (idx === 1) {
        // Islet 1: Warung Kopi Klotok & Gorengan Pinggir Langit
        makeWarungKopi(isletMesh, 0, topH, 0, { tarpMat: matBlueTarp, rotY: 0.4 });
        makeSepedaOnthel(isletMesh, -1.5, topH, 0.2, 0.4);
        makePohonKelapa(isletMesh, 2.2, topH, -1.2, 1.1, 0.4);
        makePohonPisang(isletMesh, -2.0, topH, -1.2, 0.95);
      } else if (idx === 2) {
        // Islet 2: Pos Ronda / Gardu Kamling Desa
        makePosRonda(isletMesh, 0, topH, 0, -0.3);
        makePohonPisang(isletMesh, -1.8, topH, 1.2, 1.0);
        addTree(isletMesh, 1.8, topH, -1.2, 0.75, false);
      } else if (idx === 3) {
        // Islet 3: Warung Kelontong & Sembako Madura
        makeVillageHouse(isletMesh, 0, topH, -0.4, { w: 3.0, h: 1.9, d: 2.2, wallMat: matGedek, roofMat: matZinc, hasPorch: false, rotY: 0.2 });
        makeWarungKopi(isletMesh, 0.6, topH, 1.4, { tarpMat: matOrangeTarp, rotY: 0.2 });
        makePohonPisang(isletMesh, -2.0, topH, 0.8, 1.0);
        addTree(isletMesh, 2.0, topH, -1.5, 0.8, false);
      } else if (idx === 4) {
        // Islet 4: Rumah Panggung Gedek Bambu & Sumur Timba Tradisional
        makeVillageHouse(isletMesh, -0.6, topH, -0.4, { w: 3.2, h: 2.0, d: 2.4, wallMat: matGedek, roofMat: matLib.terracotta, hasPorch: true, rotY: -0.4 });
        // Sumur Timba Batu
        const sumur = new THREE.Group();
        sumur.position.set(2.0, topH, 1.2);
        sumur.add(makeMesh(geoLib.cyl12, matLib.stone, 0.65, 0.7, 0.65, 0, 0.35, 0));
        sumur.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.4, 0.04, -0.45, 0.9, 0));
        sumur.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.4, 0.04, 0.45, 0.9, 0));
        const sumurCross = makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.0, 0.04, 0, 1.55, 0);
        sumurCross.rotation.z = Math.PI / 2;
        sumur.add(sumurCross);
        isletMesh.add(sumur);
        makeJemuranBaju(isletMesh, -1.8, topH, 1.6, 0.5);
        makePohonKelapa(isletMesh, 2.4, topH, -1.5, 1.05, -0.35);
      } else if (idx === 5) {
        // Islet 5: Warung Es Kelapa Muda & Rujak Pesisir
        const esKelapa = new THREE.Group();
        esKelapa.position.set(0, topH, 0);
        esKelapa.rotation.y = 0.5;
        esKelapa.add(makeMesh(geoLib.box, matLib.wood, 2.6, 0.1, 1.8, 0, 0.1, 0));
        [[-1.1, -0.7], [1.1, -0.7], [-1.1, 0.7], [1.1, 0.7]].forEach(([px, pz]) => {
          esKelapa.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.05, 1.8, 0.05, px, 0.95, pz));
        });
        esKelapa.add(makeMesh(geoLib.cone4, matLib.roof, 3.2, 1.1, 2.4, 0, 2.15, 0));
        esKelapa.add(makeMesh(geoLib.box, matLib.wood, 1.8, 0.1, 0.5, 0, 0.75, 0.4));
        for (let k = 0; k < 5; k++) {
          const ka = (k / 5) * Math.PI * 2;
          esKelapa.add(makeMesh(geoLib.sph, matBanana, 0.14, 0.16, 0.14, 0.5 + Math.cos(ka) * 0.2, 0.92, 0.4 + Math.sin(ka) * 0.15));
        }
        esKelapa.add(makeMesh(geoLib.sph, matLib.lamp, 0.12, 0.16, 0.12, 0, 1.5, 0, false));
        makeGlow(esKelapa, 0, 1.5, 0, 2.5, '#ffcf75');
        isletMesh.add(esKelapa);
        makePohonKelapa(isletMesh, -2.0, topH, -1.2, 1.2, 0.4);
        makePohonKelapa(isletMesh, 2.2, topH, 1.4, 0.95, -0.3);
      } else if (idx === 6) {
        // Islet 6: Bengkel Motor & Tambal Ban Kampung
        makeVillageHouse(isletMesh, -0.4, topH, -0.4, { w: 3.0, h: 1.8, d: 2.2, wallMat: matLib.woodDark, roofMat: matZinc, hasPorch: false, rotY: -0.2 });
        const banGroup = new THREE.Group();
        banGroup.position.set(1.4, topH, 1.0);
        for (let b = 0; b < 3; b++) {
          banGroup.add(makeMesh(geoLib.cyl12, matLib.candiStoneDark, 0.28, 0.12, 0.28, 0, 0.08 + b * 0.12, 0));
        }
        const kompresor = makeMesh(geoLib.cyl12, matLib.royalRed, 0.2, 0.45, 0.2, 0.65, 0.25, 0);
        kompresor.rotation.z = Math.PI / 2;
        banGroup.add(kompresor);
        isletMesh.add(banGroup);
        makePohonPisang(isletMesh, -2.2, topH, 1.4, 1.0);
        addTree(isletMesh, 2.2, topH, -1.5, 0.85, false);
      } else {
        // Islet 7: Gubuk Sawah Tani & Kurungan Ayam Jago
        const gubuk = new THREE.Group();
        gubuk.position.set(-0.6, topH, -0.5);
        gubuk.rotation.y = 0.4;
        [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([px, pz]) => {
          gubuk.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.05, 1.8, 0.05, px, 0.9, pz));
        });
        gubuk.add(makeMesh(geoLib.box, matLib.wood, 2.0, 0.1, 2.0, 0, 0.6, 0));
        gubuk.add(makeMesh(geoLib.cone4, matLib.roof, 2.4, 1.0, 2.4, 0, 2.0, 0));
        isletMesh.add(gubuk);
        const kurungan = makeMesh(geoLib.cone7, matGedek, 0.45, 0.55, 0.45, 1.6, topH + 0.28, 0.8);
        kurungan.rotation.x = Math.PI;
        isletMesh.add(kurungan);
        makePohonPisang(isletMesh, 1.8, topH, -1.2, 1.1);
        makePohonPisang(isletMesh, -2.0, topH, 1.5, 0.85);
      }
    });

    let studioSmokeEmitter = null;
    const smokeSprites = [];
    const sandfallGrains = [];
    const parangtritisKites = [];
    const windDustParticles = [];
    const cloudChunks = [];

    // Build the 4 main islands
    islandsList.forEach((isl) => {
      const g = new THREE.Group();
      g.position.set(isl.x, 0, isl.z);

      const terrain = new THREE.Mesh(buildIslandTerrain(isl), islandTerrainMat);
      terrain.castShadow = true;
      terrain.receiveShadow = true;
      g.add(terrain);

      // Docking pier
      const dockGroup = new THREE.Group();
      const dockA = isl.dock;
      const dockDist = isl.r * 0.94;
      const dx = Math.cos(dockA) * dockDist;
      const dz = Math.sin(dockA) * dockDist;
      dockGroup.position.set(dx, isl.top + 0.2, dz);
      dockGroup.rotation.y = -dockA;

      dockGroup.add(makeMesh(geoLib.box, matLib.wood, 7, 0.3, 2.2, 3.5, 0, 0));
      dockGroup.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.14, 2.4, 0.14, 1.2, -0.9, 1.0));
      dockGroup.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.14, 2.4, 0.14, 5.8, -0.9, 1.0));
      dockGroup.add(makeMesh(geoLib.cyl6, matLib.metal, 0.16, 5.2, 0.16, 6.7, 2.6, 0));
      dockGroup.add(makeMesh(geoLib.cyl12, matLib.gold, 0.5, 0.15, 0.5, 6.7, 5.1, 0));

      const lantern = makeMesh(geoLib.sph, matLib.lamp, 0.22, 0.3, 0.22, 1.5, 1.8, 1.2, false);
      dockGroup.add(lantern);
      makeGlow(dockGroup, 1.5, 1.8, 1.2, 3.0, '#ffc37a');
      g.add(dockGroup);

      const mooringOffset = 5.2;
      isl.dockPos = new THREE.Vector3(
        isl.x + Math.cos(dockA) * (dockDist + mooringOffset) - Math.sin(dockA) * 3.5,
        17.4,
        isl.z + Math.sin(dockA) * (dockDist + mooringOffset) + Math.cos(dockA) * 3.5
      );
      isl.dockAngle = dockA;

      // Island Details (Authentic Yogyakarta Landmarks & Architecture)
      if (isl.kind === 'studio') {
        // Keraton Yogyakarta - Pendopo Agung & Bangsal Kencana Style
        const studio = new THREE.Group();
        studio.position.set(-1, isl.top + 0.8, 1);
        studio.rotation.y = 0.45;

        // Elevated Polished White Marble Plinth with Royal Red Velvet Carpet Aisle
        studio.add(makeMesh(geoLib.box, matLib.stone, 9.4, 0.4, 7.4, 0, 0.1, 0));
        studio.add(makeMesh(geoLib.box, matLib.keratonMarble, 9.0, 0.35, 7.0, 0, 0.35, 0));
        studio.add(makeMesh(geoLib.box, matLib.royalRed, 2.4, 0.38, 6.8, 0, 0.36, 0)); // Karpet Merah Keraton

        // 4 Massive Inner Royal Pillars (Saka Guru) in Hijau Pareanom Keraton & Gold with Lotus Umpak
        const sokoPositions = [[-2.4, -1.6], [2.4, -1.6], [-2.4, 1.6], [2.4, 1.6]];
        sokoPositions.forEach(([sx, sz]) => {
          studio.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.65, 0.45, 0.65, sx, 0.55, sz)); // Umpak batu hitam
          studio.add(makeMesh(geoLib.box, matLib.keratonGold, 0.6, 0.18, 0.6, sx, 0.85, sz)); // Ornamen daun teratai emas
          studio.add(makeMesh(geoLib.cyl12, matLib.pareanomGreen, 0.25, 3.4, 0.25, sx, 2.4, sz)); // Tiang Hijau Pareanom Keraton
          studio.add(makeMesh(geoLib.box, matLib.keratonGold, 0.55, 0.3, 0.55, sx, 4.1, sz)); // Mahkota tiang emas
        });

        // 12 Outer Perimeter Pillars (Saka Rowo) in Hijau Pareanom & Gold
        const outerPillars = [
          [-4.0, -2.8], [-1.3, -2.8], [1.3, -2.8], [4.0, -2.8],
          [-4.0, 2.8], [-1.3, 2.8], [1.3, 2.8], [4.0, 2.8],
          [-4.0, -0.9], [-4.0, 0.9], [4.0, -0.9], [4.0, 0.9]
        ];
        outerPillars.forEach(([px, pz]) => {
          studio.add(makeMesh(geoLib.box, matLib.keratonGold, 0.32, 0.2, 0.32, px, 0.45, pz));
          studio.add(makeMesh(geoLib.cyl6, matLib.pareanomGreen, 0.14, 2.6, 0.14, px, 1.75, pz));
          studio.add(makeMesh(geoLib.box, matLib.keratonGold, 0.28, 0.15, 0.28, px, 3.05, pz));
        });

        // Atap Joglo Lambang Gantung Khas Bangsal Kencana (Tajug Lawakan Lambang Gantung)
        // Lower roof eave (Atap Penitih / Pananggap)
        const roofBase = makeMesh(geoLib.prism, matLib.roof, 10.4, 1.6, 8.4, 0, 3.5, 0);
        roofBase.rotation.y = Math.PI / 2;
        studio.add(roofBase);

        // Sela Ventilasi Lambang Gantung (Golden Carved Kemanchang & Timber Louvers)
        studio.add(makeMesh(geoLib.box, matLib.woodDark, 4.6, 0.7, 3.8, 0, 4.3, 0));
        studio.add(makeMesh(geoLib.box, matLib.keratonGold, 5.0, 0.2, 4.2, 0, 4.65, 0));

        // Steep Central Tajug Pyramid (Brunjung Puncak Keraton)
        const centralTajug = makeMesh(geoLib.cone4, matLib.roof, 4.8, 3.2, 4.0, 0, 5.9, 0);
        centralTajug.rotation.y = Math.PI / 4;
        studio.add(centralTajug);

        // Tumpang Sari (Tiered Carved Teak Ceiling under the Tajug Roof)
        for (let ts = 0; ts < 3; ts++) {
          const tsSize = 4.2 - ts * 0.9;
          const tsY = 5.0 + ts * 0.45;
          studio.add(makeMesh(geoLib.box, matLib.keratonGold, tsSize, 0.15, tsSize * 0.8, 0, tsY, 0));
          studio.add(makeMesh(geoLib.box, matLib.woodDark, tsSize - 0.2, 0.14, (tsSize * 0.8) - 0.2, 0, tsY + 0.05, 0));
        }

        // Golden Ridge Finial & Mustaka Emas Keraton (Mahkota Kemuncak)
        studio.add(makeMesh(geoLib.box, matLib.keratonGold, 0.4, 0.9, 0.4, 0, 7.5, 0));
        studio.add(makeMesh(geoLib.cone4, matLib.keratonGold, 0.35, 0.7, 0.35, 0, 8.2, 0));

        // Royal Chandelier (Lampu Robyong Keraton)
        studio.add(makeMesh(geoLib.cyl12, matLib.keratonGold, 0.12, 1.2, 0.12, 0, 3.6, 0));
        studio.add(makeMesh(geoLib.sph, matLib.lamp, 0.35, 0.35, 0.35, 0, 2.8, 0, false));
        makeGlow(studio, 0, 2.8, 0, 8.0, '#ffd894');

        // Gamelan Orchestra Ensemble (Gong Ageng & Bonang Barung)
        const gamelanGroup = new THREE.Group();
        gamelanGroup.position.set(-2.0, 0.52, -0.2);

        // Gayor (Gong Stand) with carved uprights and crossbeam
        gamelanGroup.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 1.7, 0.08, -1.0, 0.85, 0));
        gamelanGroup.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 1.7, 0.08, 1.0, 0.85, 0));
        gamelanGroup.add(makeMesh(geoLib.box, matLib.woodDark, 2.2, 0.14, 0.14, 0, 1.6, 0));
        // Gong Ageng (Large brass suspended gong with central boss)
        const gongRim = makeMesh(geoLib.cyl12, matLib.gold, 0.65, 0.12, 0.65, 0, 0.85, 0);
        gongRim.rotation.x = Math.PI / 2;
        gamelanGroup.add(gongRim);
        const gongBoss = makeMesh(geoLib.sph, matLib.gold, 0.18, 0.18, 0.14, 0, 0.85, 0.07);
        gamelanGroup.add(gongBoss);

        // Bonang Barung Row (8 Brass Kettles on Teak Frame)
        const bonangGroup = new THREE.Group();
        bonangGroup.position.set(1.8, 0.52, 0);
        bonangGroup.add(makeMesh(geoLib.box, matLib.woodDark, 2.6, 0.25, 0.8, 0, 0.15, 0));
        for (let b = 0; b < 4; b++) {
          const bx = -0.9 + b * 0.6;
          bonangGroup.add(makeMesh(geoLib.cyl12, matLib.gold, 0.2, 0.14, 0.2, bx, 0.32, -0.22));
          bonangGroup.add(makeMesh(geoLib.sph, matLib.gold, 0.09, 0.09, 0.09, bx, 0.39, -0.22));
          bonangGroup.add(makeMesh(geoLib.cyl12, matLib.gold, 0.2, 0.14, 0.2, bx, 0.32, 0.22));
          bonangGroup.add(makeMesh(geoLib.sph, matLib.gold, 0.09, 0.09, 0.09, bx, 0.39, 0.22));
        }
        // Kendang (Traditional Double-Headed Barrel Drum on Teak Cradle)
        const kendang = new THREE.Group();
        kendang.position.set(0, 0.52, -1.8);
        kendang.add(makeMesh(geoLib.box, matLib.woodDark, 1.4, 0.35, 0.5, 0, 0.18, 0)); // Penyangga silang kayu
        kendang.add(makeMesh(geoLib.cyl12, matLib.wood, 0.3, 1.3, 0.24, 0, 0.42, 0)); // Badan kendang
        kendang.children[1].rotation.z = Math.PI / 2;
        kendang.add(makeMesh(geoLib.cyl12, matLib.cream, 0.26, 0.05, 0.26, -0.65, 0.42, 0)); // Kulit tebokan kiri
        kendang.children[2].rotation.z = Math.PI / 2;
        kendang.add(makeMesh(geoLib.cyl12, matLib.cream, 0.22, 0.05, 0.22, 0.65, 0.42, 0)); // Kulit tebokan kanan
        kendang.children[3].rotation.z = Math.PI / 2;
        studio.add(kendang);

        // Dampar Kencana Keraton (Sultan's Golden Royal Throne & Songsong Agung)
        const dampar = new THREE.Group();
        dampar.position.set(0, 0.52, -0.8);
        dampar.add(makeMesh(geoLib.box, matLib.keratonGold, 1.6, 0.35, 1.3, 0, 0.18, 0)); // Singgasana emas
        dampar.add(makeMesh(geoLib.box, matLib.woodDark, 1.5, 1.2, 0.2, 0, 0.8, -0.55)); // Sandaran ukir jati
        dampar.add(makeMesh(geoLib.box, matLib.gold, 1.3, 0.18, 0.9, 0, 0.4, -0.05)); // Bantalan beledu emas
        // Sepasang Payung Upacara Songsong Triwikrama Emas di belakang tahta
        dampar.add(makeMesh(geoLib.cyl6, matLib.gold, 0.04, 2.2, 0.04, -0.85, 1.2, -0.65));
        dampar.add(makeMesh(geoLib.cone7, matLib.keratonGold, 0.6, 0.4, 0.6, -0.85, 2.4, -0.65));
        dampar.add(makeMesh(geoLib.cyl6, matLib.gold, 0.04, 2.2, 0.04, 0.85, 1.2, -0.65));
        dampar.add(makeMesh(geoLib.cone7, matLib.keratonGold, 0.6, 0.4, 0.6, 0.85, 2.4, -0.65));
        studio.add(dampar);

        studio.add(gamelanGroup);
        studio.add(bonangGroup);

        // Brass Incense Burner (Pedupaan Dupa Keraton)
        const pedupaan = new THREE.Group();
        pedupaan.position.set(0, 0.52, 2.4);
        pedupaan.add(makeMesh(geoLib.cyl12, matLib.keratonGold, 0.25, 0.35, 0.25, 0, 0.2, 0));
        pedupaan.add(makeMesh(geoLib.sph, matLib.keratonGold, 0.3, 0.2, 0.3, 0, 0.45, 0));
        pedupaan.add(makeMesh(geoLib.cone4, matLib.keratonGold, 0.2, 0.35, 0.2, 0, 0.65, 0));
        studio.add(pedupaan);

        // Pagar Kemagangan Baluwerti & Regol Donopratopo (White Fortress Wall with Royal Portal)
        g.add(makeMesh(geoLib.box, matLib.white, 14.0, 0.6, 0.3, -1, isl.top + 0.6, -7));
        g.add(makeMesh(geoLib.box, matLib.white, 0.3, 0.6, 12.0, -8, isl.top + 0.6, 0));
        g.add(makeMesh(geoLib.box, matLib.white, 0.3, 0.6, 12.0, 6, isl.top + 0.6, 0));

        // Regol Donopratopo (Arched Royal Gateway at Entrance)
        const regol = new THREE.Group();
        regol.position.set(-1, isl.top + 0.6, 6.2);
        regol.add(makeMesh(geoLib.box, matLib.white, 1.0, 3.2, 0.8, -1.5, 1.6, 0)); // Tiang kiri
        regol.add(makeMesh(geoLib.box, matLib.white, 1.0, 3.2, 0.8, 1.5, 1.6, 0)); // Tiang kanan
        regol.add(makeMesh(geoLib.box, matLib.white, 4.0, 0.8, 0.9, 0, 3.6, 0)); // Ambang atas
        regol.add(makeMesh(geoLib.box, matLib.malioboroGreen, 1.8, 2.8, 0.15, 0, 1.4, 0)); // Pintu gerbang hijau keraton
        regol.add(makeMesh(geoLib.box, matLib.keratonGold, 0.8, 0.5, 0.25, 0, 3.7, 0.45)); // Lambang Praja Cihna
        // Arca Dwarapala Penjaga Regol (Cingkarabala & Balaupata)
        regol.add(makeMesh(geoLib.cyl6, matLib.candiStoneDark, 0.35, 1.1, 0.35, -2.4, 0.55, 0.4));
        regol.add(makeMesh(geoLib.sph, matLib.candiStoneAccent, 0.25, 0.28, 0.25, -2.4, 1.25, 0.4));
        regol.add(makeMesh(geoLib.cyl6, matLib.candiStoneDark, 0.35, 1.1, 0.35, 2.4, 0.55, 0.4));
        regol.add(makeMesh(geoLib.sph, matLib.candiStoneAccent, 0.25, 0.28, 0.25, 2.4, 1.25, 0.4));
        g.add(regol);

        // Fragrant incense smoke emitter
        studioSmokeEmitter = new THREE.Vector3(isl.x - 1, isl.top + 2.0, isl.z + 3.4);

        g.add(studio);

        // Tropical Kamboja & Banyan Trees
        addTree(g, -7, isl.top + 0.8, 4.5, 1.2, false);
        addTree(g, 6, isl.top + 0.8, 6.5, 1.0, false);
        addTree(g, 7, isl.top + 0.8, -5, 1.15, true);
        addTree(g, -8, isl.top + 0.8, -5.5, 0.95, false);

        // Kamboja Blossom Bushes
        const bush1 = makeMesh(geoLib.ico, matLib.flower, 1.2, 0.75, 1.2, -4, isl.top + 0.9, 6.5);
        const bush2 = makeMesh(geoLib.ico, matLib.flower, 1.0, 0.65, 1.0, 5, isl.top + 0.9, -6.5);
        g.add(bush1, bush2);

        // Sacred Spring stream flowing from island cliff
        const waterfallGeo = new THREE.PlaneGeometry(2.4, 28, 1, 1);
        const waterfallMat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          fog: false,
          uniforms: { uTime: skyUniforms.uTime },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              float s = fract(vUv.y * 5.0 + uTime * 1.5 + sin(vUv.x * 20.0) * 0.05);
              float a = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x) * smoothstep(0.0, 0.5, vUv.y);
              vec3 col = mix(vec3(0.75, 0.85, 1.0), vec3(1.0), step(0.6, s));
              gl_FragColor = vec4(col, a * 0.75);
            }
          `
        });
        const waterfall = new THREE.Mesh(waterfallGeo, waterfallMat);
        waterfall.position.set(-isl.r * 0.75, isl.top - 12, isl.r * 0.6);
        waterfall.lookAt(-isl.r * 2.0, isl.top - 12, isl.r * 1.5);
        g.add(waterfall);

        // 4 Banyan Trees at 4 Outer Corners of Rectangular Keraton Platform
        addTree(g, -11.5, isl.top + 0.8, -9.5, 1.35, false);
        addTree(g, 11.5, isl.top + 0.8, -9.5, 1.35, false);
        addTree(g, -11.5, isl.top + 0.8, 9.5, 1.35, false);
        addTree(g, 11.5, isl.top + 0.8, 9.5, 1.35, false);

        // Waringin Kurung Alun-Alun Keraton (Kyai Janadaru & Kyai Dewadaru dengan Pagar Sasak Putih Berukir Emas)
        const makeWaringinKurung = (wx, wz) => {
          const wGroup = new THREE.Group();
          wGroup.position.set(wx, isl.top + 0.8, wz);
          const fenceRadius = 2.4;
          const numPosts = 12;
          for (let p = 0; p < numPosts; p++) {
            const pAngle = (p / numPosts) * Math.PI * 2;
            const px = Math.cos(pAngle) * fenceRadius;
            const pz = Math.sin(pAngle) * fenceRadius;
            wGroup.add(makeMesh(geoLib.box, matLib.white, 0.14, 1.1, 0.14, px, 0.55, pz));
            wGroup.add(makeMesh(geoLib.cone4, matLib.keratonGold, 0.12, 0.22, 0.12, px, 1.2, pz));
          }
          // White Circular Ring Railing
          const railGeo = new THREE.TorusGeometry(fenceRadius, 0.05, 6, 24);
          const rail1 = new THREE.Mesh(railGeo, matLib.white);
          rail1.rotation.x = Math.PI / 2;
          rail1.position.y = 0.4;
          wGroup.add(rail1);
          const rail2 = new THREE.Mesh(railGeo, matLib.white);
          rail2.rotation.x = Math.PI / 2;
          rail2.position.y = 0.9;
          wGroup.add(rail2);

          // Batang & Kanopi Beringin Bulat Alun-Alun
          wGroup.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.42, 2.2, 0.42, 0, 1.1, 0));
          wGroup.add(makeMesh(geoLib.ico, matLib.leaf, 2.5, 1.8, 2.5, 0, 2.7, 0));
          wGroup.add(makeMesh(geoLib.ico, matLib.leaf2, 2.1, 1.4, 2.1, 0, 3.5, 0));
          g.add(wGroup);
        };
        makeWaringinKurung(-4.2, 3.8); // Kyai Janadaru
        makeWaringinKurung(2.2, 3.8);  // Kyai Dewadaru

        // Sumbu Filosofi Axis Stone Paved Road leading toward the pier
        const axisRoad = makeMesh(geoLib.box, matLib.stone, 2.6, 0.08, 13.0, 0, isl.top + 0.84, 4.2);
        g.add(axisRoad);

        // --- TAMAN & PELATARAN KERATON YOGYAKARTA (Populated, Royal & Authentic) ---

        // 1. JALAN SETAPAK BATU PENGHUBUNG DERMAGA KE ALUN-ALUN & REGOL
        const keratonPathSteps = 11;
        const kStartX = 12.5, kStartZ = -8.0; // Near dock
        const kEndX = 0.0, kEndZ = 8.5;       // In front of Alun-Alun / Sumbu Filosofi
        for (let ps = 0; ps <= keratonPathSteps; ps++) {
          const t = ps / keratonPathSteps;
          const px = kStartX + (kEndX - kStartX) * t + Math.sin(t * Math.PI) * 2.2;
          const pz = kStartZ + (kEndZ - kStartZ) * t;
          const pStone = makeMesh(geoLib.box, matLib.stone, 2.4, 0.08, 1.4, px, isl.top + 0.84, pz);
          pStone.rotation.y = Math.atan2(kEndX - kStartX, kEndZ - kStartZ);
          g.add(pStone);

          // Pasangan Lampu Marmer & Kuningan Keraton (Lampu Praja)
          if (ps % 3 === 1) {
            const side = 1.7;
            const perpX = -Math.sin(pStone.rotation.y) * side;
            const perpZ = Math.cos(pStone.rotation.y) * side;
            [-1, 1].forEach((dir) => {
              const lx = px + perpX * dir;
              const lz = pz + perpZ * dir;
              const lampG = new THREE.Group();
              lampG.position.set(lx, isl.top + 0.8, lz);
              lampG.add(makeMesh(geoLib.box, matLib.white, 0.45, 0.3, 0.45, 0, 0.15, 0)); // Umpak marmer putih
              lampG.add(makeMesh(geoLib.cyl6, matLib.pareanomGreen, 0.14, 1.1, 0.14, 0, 0.7, 0)); // Tiang hijau keraton
              lampG.add(makeMesh(geoLib.box, matLib.keratonGold, 0.4, 0.1, 0.4, 0, 1.3, 0));
              lampG.add(makeMesh(geoLib.sph, matLib.lamp, 0.18, 0.22, 0.18, 0, 1.5, 0, false));
              lampG.add(makeMesh(geoLib.cone4, matLib.keratonGold, 0.42, 0.35, 0.42, 0, 1.8, 0)); // Mahkota emas
              makeGlow(lampG, 0, 1.5, 0, 2.8, '#ffe294');
              g.add(lampG);
            });
          }
        }

        // 2. POS JAGA PRAJURIT KERATON (Royal Guard Post with Spear Rack & Slit Drum)
        const posJaga = new THREE.Group();
        posJaga.position.set(8.5, isl.top + 0.8, -4.5);
        posJaga.rotation.y = -0.6;
        // Batur lantai marmer putih
        posJaga.add(makeMesh(geoLib.box, matLib.white, 3.4, 0.3, 2.8, 0, 0.15, 0));
        posJaga.add(makeMesh(geoLib.box, matLib.wood, 3.0, 0.1, 2.4, 0, 0.35, 0));
        // 4 Tiang Jati Hijau Pareanom
        [[-1.15, -0.9], [1.15, -0.9], [-1.15, 0.9], [1.15, 0.9]].forEach(([px, pz]) => {
          posJaga.add(makeMesh(geoLib.cyl6, matLib.pareanomGreen, 0.08, 1.8, 0.08, px, 1.25, pz));
          posJaga.add(makeMesh(geoLib.box, matLib.keratonGold, 0.18, 0.15, 0.18, px, 2.15, pz));
        });
        // Atap Limasan Peneduh Sirap
        posJaga.add(makeMesh(geoLib.cone4, matLib.roof, 4.0, 1.3, 3.4, 0, 2.75, 0));
        posJaga.add(makeMesh(geoLib.sph, matLib.keratonGold, 0.14, 0.2, 0.14, 0, 3.5, 0));
        // Rak Tombak Prajurit Keraton (Spear Rack dengan 4 Tombak Pusaka Emas)
        const spearRack = new THREE.Group();
        spearRack.position.set(0, 0.35, -0.65);
        spearRack.add(makeMesh(geoLib.box, matLib.woodDark, 1.8, 0.2, 0.3, 0, 0.1, 0));
        for (let sp = -1.5; sp <= 1.5; sp += 1) {
          spearRack.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.035, 1.7, 0.035, sp * 0.38, 0.95, 0));
          spearRack.add(makeMesh(geoLib.cone4, matLib.keratonGold, 0.08, 0.32, 0.08, sp * 0.38, 1.9, 0));
        }
        posJaga.add(spearRack);
        // Kentongan Kayu Jati Gantung
        const kentonganMesh = makeMesh(geoLib.cyl6, matLib.woodDark, 0.12, 0.7, 0.12, 0.9, 1.5, 0.4);
        kentonganMesh.rotation.z = Math.PI / 2;
        posJaga.add(kentonganMesh);
        g.add(posJaga);

        // 3. BANGSAL KERETA KENCANA SULTAN (Royal Carriage Pavilion & Golden Carriage)
        const keretaPavilion = new THREE.Group();
        keretaPavilion.position.set(7.5, isl.top + 0.8, 2.5);
        keretaPavilion.rotation.y = 0.4;
        // Peneduh Kanopi Ukir Jati
        keretaPavilion.add(makeMesh(geoLib.box, matLib.stone, 5.0, 0.25, 4.0, 0, 0.12, 0));
        [[-2.1, -1.6], [2.1, -1.6], [-2.1, 1.6], [2.1, 1.6]].forEach(([cx, cz]) => {
          keretaPavilion.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.1, 2.4, 0.1, cx, 1.3, cz));
          keretaPavilion.add(makeMesh(geoLib.box, matLib.keratonGold, 0.22, 0.15, 0.22, cx, 2.5, cz));
        });
        keretaPavilion.add(makeMesh(geoLib.prism, matLib.roof, 5.4, 1.2, 4.4, 0, 3.1, 0));

        // Kereta Kencana 3D (Golden Royal Carriage Kyai Garuda Yeksa)
        const kereta = new THREE.Group();
        kereta.position.set(0, 0.25, 0);
        // 4 Roda Emas Berjeruji Besar
        [[-1.4, 0.45, -1.0], [1.4, 0.45, -1.0], [-1.4, 0.55, 1.0], [1.4, 0.55, 1.0]].forEach(([wx, wy, wz]) => {
          const wheel = makeMesh(geoLib.cyl12, matLib.keratonGold, 0.5, 0.08, 0.5, wx, wy, wz);
          wheel.rotation.z = Math.PI / 2;
          kereta.add(wheel);
          const hub = makeMesh(geoLib.sph, matLib.gold, 0.12, 0.12, 0.12, wx, wy, wz);
          kereta.add(hub);
        });
        // Kabin Kereta Beledu Merah Marun & Lis Emas
        kereta.add(makeMesh(geoLib.box, matLib.royalRed, 2.2, 1.3, 1.6, 0, 1.3, 0));
        kereta.add(makeMesh(geoLib.box, matLib.keratonGold, 2.3, 0.08, 1.7, 0, 0.65, 0)); // Lis bawah emas
        kereta.add(makeMesh(geoLib.box, matLib.keratonGold, 2.3, 0.08, 1.7, 0, 1.95, 0)); // Lis atas emas
        // Jendela Kaca Kabin
        kereta.add(makeMesh(geoLib.box, matLib.window, 0.8, 0.6, 1.65, 0, 1.35, 0));
        // Atap Kubah Mahkota Garuda Yeksa
        kereta.add(makeMesh(geoLib.prism, matLib.keratonGold, 2.0, 0.4, 1.5, 0, 2.2, 0));
        kereta.add(makeMesh(geoLib.cone4, matLib.keratonGold, 0.3, 0.55, 0.3, 0, 2.65, 0)); // Mustaka Garuda
        // Bangku Kusir Depan & Lentera Kereta
        kereta.add(makeMesh(geoLib.box, matLib.woodDark, 1.6, 0.4, 0.8, 0, 0.9, -1.2));
        kereta.add(makeMesh(geoLib.cyl6, matLib.keratonGold, 0.08, 0.35, 0.08, -0.7, 1.4, -1.4));
        kereta.add(makeMesh(geoLib.cyl6, matLib.keratonGold, 0.08, 0.35, 0.08, 0.7, 1.4, -1.4));
        keretaPavilion.add(kereta);
        g.add(keretaPavilion);

        // 4. UMBUL-UMBUL PUSAKA KERATON (Yellow & Pareanom Green Silk Banners on Bamboo Poles)
        const bannerPositions = [[-2.5, 8.5], [2.5, 8.5], [-2.5, 1.5], [2.5, 1.5]];
        bannerPositions.forEach(([bx, bz], bi) => {
          const pole = new THREE.Group();
          pole.position.set(bx, isl.top + 0.8, bz);
          pole.add(makeMesh(geoLib.cyl6, matLib.wood, 0.05, 4.2, 0.05, 0, 2.1, 0));
          pole.add(makeMesh(geoLib.sph, matLib.keratonGold, 0.1, 0.15, 0.1, 0, 4.25, 0));
          const bMat = bi % 2 === 0 ? matLib.keratonGold : matLib.pareanomGreen;
          const banner = makeMesh(geoLib.box, bMat, 0.04, 2.6, 0.45, 0.15, 2.7, 0);
          banner.rotation.z = 0.08;
          pole.add(banner);
          g.add(pole);
        });

        // 5. TAMAN BUNGA MELATI & KAMBOJA KERATON (Lush Flower Clusters Across Lawns)
        [
          [-8.5, 0.9, 2.0], [8.5, 0.9, -1.5],
          [-3.0, 0.9, -7.5], [3.0, 0.9, -7.5],
          [-1.0, 0.9, 10.5], [8.0, 0.9, 6.5]
        ].forEach(([fx, fy, fz]) => {
          g.add(makeMesh(geoLib.ico, matLib.flower, 0.75, 0.45, 0.75, fx, isl.top + fy, fz));
          g.add(makeMesh(geoLib.ico, matLib.leaf2, 0.85, 0.5, 0.85, fx + 0.25, isl.top + fy - 0.1, fz + 0.15));
        });
      } else if (isl.kind === 'gallery') {
        // Kompleks Candi Prambanan (Trimurti: Candi Siwa, Brahma, & Wisnu)
        const gal = new THREE.Group();
        gal.position.set(0, isl.top + 0.8, 0);
        gal.rotation.y = -0.35;

        // Sacred Stepped Terrace Plinth (Pelataran Jaba Tengah)
        gal.add(makeMesh(geoLib.box, matLib.candiStoneDark, 17.5, 0.5, 13.5, 0, 0.25, 0.5));
        gal.add(makeMesh(geoLib.box, matLib.candiStone, 16.5, 0.35, 12.5, 0, 0.65, 0.5));

        // Reusable Prambanan Shikhara Tower Builder
        const buildPrambananShikhara = (parent, { x = 0, z = 0, scale = 1.0, isMain = false }) => {
          const tGroup = new THREE.Group();
          tGroup.position.set(x, 0.8, z);

          // 1. Bhur Loka (Stepped Cruciform Base & Balustrade Relief Panels)
          tGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 6.0 * scale, 0.7 * scale, 6.0 * scale, 0, 0.35 * scale, 0));
          // Projecting cross porches (cruciform footprint characteristic of Prambanan)
          tGroup.add(makeMesh(geoLib.box, matLib.candiStone, 3.2 * scale, 0.65 * scale, 7.2 * scale, 0, 0.35 * scale, 0));
          tGroup.add(makeMesh(geoLib.box, matLib.candiStone, 7.2 * scale, 0.65 * scale, 3.2 * scale, 0, 0.35 * scale, 0));
          // Balustrade band with carved relief niches
          tGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 5.0 * scale, 0.5 * scale, 5.0 * scale, 0, 0.9 * scale, 0));
          // Prambanan relief friezes (Kalpataru tree & lion motifs)
          tGroup.add(makeMesh(geoLib.box, matLib.candiStoneWarm, 4.4 * scale, 0.25 * scale, 5.2 * scale, 0, 1.05 * scale, 0));
          tGroup.add(makeMesh(geoLib.box, matLib.candiStoneWarm, 5.2 * scale, 0.25 * scale, 4.4 * scale, 0, 1.05 * scale, 0));

          // 2. Bhuwah Loka (Main Sanctuary Body)
          const bodyH = 2.8 * scale;
          const bodyY = 1.15 * scale + bodyH * 0.5;
          tGroup.add(makeMesh(geoLib.box, matLib.candiStone, 3.6 * scale, bodyH, 3.6 * scale, 0, bodyY, 0));

          // Projecting Gopura / Kala-Makara Entrance Portal (South-facing entrance)
          const portalH = 2.4 * scale;
          tGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.8 * scale, portalH, 1.3 * scale, 0, 1.15 * scale + portalH * 0.5, 2.0 * scale));
          // Kala arch hood relief above entrance
          tGroup.add(makeMesh(geoLib.box, matLib.candiStoneWarm, 1.4 * scale, 0.5 * scale, 0.4 * scale, 0, 1.15 * scale + portalH + 0.15 * scale, 2.35 * scale));
          // Deep recessed sanctum interior cavity (Ruang Garbhagriha)
          tGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.95 * scale, 1.6 * scale, 0.6 * scale, 0, 1.15 * scale + 0.8 * scale, 2.35 * scale));

          // Candi Siwa (Main Shiva Temple) has 4 Cardinal Projecting Portals (North Durga, West Ganesha, East Shiva)
          if (isMain) {
            // North Portal (Bilik Durga Mahisasuramardini)
            tGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.8 * scale, portalH, 1.3 * scale, 0, 1.15 * scale + portalH * 0.5, -2.0 * scale));
            tGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.95 * scale, 1.6 * scale, 0.6 * scale, 0, 1.15 * scale + 0.8 * scale, -2.35 * scale));

            // West Portal (Bilik Ganesha)
            tGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.3 * scale, portalH, 1.8 * scale, -2.0 * scale, 1.15 * scale + portalH * 0.5, 0));
            tGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.6 * scale, 1.6 * scale, 0.95 * scale, -2.35 * scale, 1.15 * scale + 0.8 * scale, 0));

            // East Portal (Bilik Mahadewa)
            tGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.3 * scale, portalH, 1.8 * scale, 2.0 * scale, 1.15 * scale + portalH * 0.5, 0));
            tGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.6 * scale, 1.6 * scale, 0.95 * scale, 2.35 * scale, 1.15 * scale + 0.8 * scale, 0));
          }

          // Sepasang Arca Dvarapala Penjaga Candi di samping tangga masuk
          const dwarapalaMat = matLib.candiStoneWarm;
          tGroup.add(makeMesh(geoLib.cyl6, dwarapalaMat, 0.18 * scale, 0.65 * scale, 0.18 * scale, -1.2 * scale, 0.75 * scale, 2.4 * scale));
          tGroup.add(makeMesh(geoLib.sph, dwarapalaMat, 0.15 * scale, 0.18 * scale, 0.15 * scale, -1.2 * scale, 1.15 * scale, 2.4 * scale));
          tGroup.add(makeMesh(geoLib.cyl6, dwarapalaMat, 0.18 * scale, 0.65 * scale, 0.18 * scale, 1.2 * scale, 0.75 * scale, 2.4 * scale));
          tGroup.add(makeMesh(geoLib.sph, dwarapalaMat, 0.15 * scale, 0.18 * scale, 0.15 * scale, 1.2 * scale, 1.15 * scale, 2.4 * scale));

          // 3. Swah Loka (Towering Stepped Shikhara Spire)
          let currentY = 1.15 * scale + bodyH;
          const tiers = isMain ? 4 : 3;
          for (let t = 0; t < tiers; t++) {
            const tierW = (3.1 - t * 0.52) * scale;
            const tierH = (0.95 - t * 0.08) * scale;
            
            // Tier cornice ledge
            tGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, (tierW + 0.25), 0.16 * scale, (tierW + 0.25), 0, currentY + 0.08 * scale, 0));
            // Tier block
            tGroup.add(makeMesh(geoLib.box, matLib.candiStone, tierW, tierH, tierW, 0, currentY + 0.16 * scale + tierH * 0.5, 0));

            // 4 Corner Ratna Stupikas on each terrace
            const stDist = (tierW * 0.5) - 0.05;
            const stY = currentY + 0.16 * scale + tierH;
            const corners = [[-stDist, -stDist], [stDist, -stDist], [-stDist, stDist], [stDist, stDist]];
            corners.forEach(([cx, cz]) => {
              tGroup.add(makeMesh(geoLib.cyl6, matLib.candiStoneAccent, 0.18 * scale, 0.45 * scale, 0.18 * scale, cx, stY + 0.22 * scale, cz));
              tGroup.add(makeMesh(geoLib.cone4, matLib.candiStoneDark, 0.18 * scale, 0.45 * scale, 0.18 * scale, cx, stY + 0.65 * scale, cz));
            });

            currentY += 0.16 * scale + tierH;
          }

          // 4. Crown (Amalaka & Mastaka / Ratna Spire)
          // Neck
          tGroup.add(makeMesh(geoLib.cyl12, matLib.candiStoneDark, 0.55 * scale, 0.35 * scale, 0.55 * scale, 0, currentY + 0.18 * scale, 0));
          // Amalaka fluted disc
          tGroup.add(makeMesh(geoLib.cyl12, matLib.candiStoneAccent, 0.95 * scale, 0.35 * scale, 0.95 * scale, 0, currentY + 0.5 * scale, 0));
          // Soaring Ratna Spire
          const spireH = (isMain ? 2.5 : 1.8) * scale;
          tGroup.add(makeMesh(geoLib.cone7, matLib.candiStone, 0.5 * scale, spireH, 0.5 * scale, 0, currentY + 0.68 * scale + spireH * 0.5, 0));
          // Golden Stupika Finial Tip
          tGroup.add(makeMesh(geoLib.sph, matLib.gold, 0.22 * scale, 0.35 * scale, 0.22 * scale, 0, currentY + 0.68 * scale + spireH + 0.15 * scale, 0));

          if (isMain) {
            // Sacred sanctum brazier glow
            makeGlow(tGroup, 0, 2.0 * scale, 2.2 * scale, 4.5, '#ffc070');
          }

          parent.add(tGroup);
          return tGroup;
        };

        // 1. Candi Siwa (Central Main Shiva Temple - Tallest & Most Grand)
        buildPrambananShikhara(gal, { x: 0, z: -2.2, scale: 1.15, isMain: true });

        // 2. Candi Brahma (South Temple - Left Flank)
        buildPrambananShikhara(gal, { x: -5.8, z: -1.6, scale: 0.82, isMain: false });

        // 3. Candi Wisnu (North Temple - Right Flank)
        buildPrambananShikhara(gal, { x: 5.8, z: -1.6, scale: 0.82, isMain: false });

        // 4. Sepasang Candi Apit (Twin Slender Guardian Temples flanking courtyard)
        buildPrambananShikhara(gal, { x: -8.8, z: 1.5, scale: 0.58, isMain: false });
        buildPrambananShikhara(gal, { x: 8.8, z: 1.5, scale: 0.58, isMain: false });

        // Candi Kelir / Perwara Miniature Gate Shrines (Flanking entrance boundaries)
        const perwaraPositions = [[-7.5, 4.8], [7.5, 4.8]];
        perwaraPositions.forEach(([px, pz]) => {
          gal.add(makeMesh(geoLib.box, matLib.candiStoneDark, 1.2, 1.6, 1.2, px, 1.5, pz));
          gal.add(makeMesh(geoLib.cone4, matLib.candiStone, 1.0, 1.4, 1.0, px, 2.8, pz));
          gal.add(makeMesh(geoLib.sph, matLib.gold, 0.18, 0.28, 0.18, px, 3.6, pz));
        });

        // Interactive Work Photography Display Frames (Jaba Tengah Courtyard Exhibition)
        const framePositions = [-3.8, 0, 3.8];
        for (let i = 0; i < 3; i++) {
          const frameGroup = new THREE.Group();
          frameGroup.position.set(framePositions[i], 0.8, 3.8);
          // Andesite Stone Pedestal
          frameGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 2.6, 0.45, 0.7, 0, 0.22, 0));
          frameGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 2.2, 0.25, 0.5, 0, 0.55, 0));
          // Teak frame and exhibition canvas
          frameGroup.add(makeMesh(geoLib.box, matLib.woodDark, 2.3, 2.9, 0.15, 0, 2.1, 0));
          const artCanvas = new THREE.Mesh(
            new THREE.PlaneGeometry(2.0, 2.6),
            new THREE.MeshStandardMaterial({
              color: c(['#d9c7b5', '#9fb1c9', '#c7a6a0'][i]),
              roughness: 0.7
            })
          );
          artCanvas.position.set(0, 2.1, 0.08);
          frameGroup.add(artCanvas);
          // Courtyard Dipa / Oil Lamp Glow
          makeGlow(frameGroup, 0, 3.5, 0.2, 4.5, '#ffd28a');
          gal.add(frameGroup);
        }

        // Sacred Prambanan Ambient Glow
        makeGlow(gal, 0, 5.0, -1.0, 14.0, '#ffe4b8');
        g.add(gal);

        // --- TAMAN WISATA & ARKEOLOGI CANDI PRAMBANAN (Lush, Populated & Alive) ---
        
        // 1. JALAN SETAPAK BATU ANDESIT DARI DERMAGA KE KOMPLEKS CANDI (Flagstone Walkway)
        const pathSteps = 12;
        const startX = -12.5, startZ = 12.0; // Near dock
        const endX = 0.0, endZ = 5.8;        // Temple entrance
        for (let ps = 0; ps <= pathSteps; ps++) {
          const t = ps / pathSteps;
          // Curving path across the grass
          const px = startX + (endX - startX) * t + Math.sin(t * Math.PI) * 1.8;
          const pz = startZ + (endZ - startZ) * t;
          const pathStone = makeMesh(geoLib.box, matLib.candiStoneAccent, 2.2, 0.08, 1.4, px, isl.top + 0.84, pz);
          pathStone.rotation.y = Math.atan2(endX - startX, endZ - startZ) + (Math.sin(ps) * 0.1);
          g.add(pathStone);

          // Pasangan Lampu Taman Batu Candi di Sepanjang Jalan (Andesite Pagoda Lanterns)
          if (ps % 3 === 1) {
            const sideDist = 1.6;
            const perpX = -Math.sin(pathStone.rotation.y) * sideDist;
            const perpZ = Math.cos(pathStone.rotation.y) * sideDist;
            [-1, 1].forEach((dir) => {
              const lx = px + perpX * dir;
              const lz = pz + perpZ * dir;
              const lanternGroup = new THREE.Group();
              lanternGroup.position.set(lx, isl.top + 0.8, lz);
              lanternGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.55, 0.3, 0.55, 0, 0.15, 0)); // Kaki umpak
              lanternGroup.add(makeMesh(geoLib.cyl6, matLib.candiStone, 0.22, 0.6, 0.22, 0, 0.6, 0)); // Tiang batu
              lanternGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 0.5, 0.35, 0.5, 0, 1.05, 0)); // Ruang lentera
              lanternGroup.add(makeMesh(geoLib.sph, matLib.lamp, 0.18, 0.18, 0.18, 0, 1.05, 0, false)); // Cahaya hangat
              lanternGroup.add(makeMesh(geoLib.cone4, matLib.candiStoneDark, 0.6, 0.35, 0.6, 0, 1.4, 0)); // Atap pagoda
              lanternGroup.add(makeMesh(geoLib.sph, matLib.gold, 0.08, 0.12, 0.08, 0, 1.65, 0)); // Pucuk emas
              makeGlow(lanternGroup, 0, 1.05, 0, 2.8, '#ffcc77');
              g.add(lanternGroup);
            });
          }
        }

        // 2. GAPURA CANDI BENTAR DI PANGKAL DERMAGA (Split Gateway Welcoming Visitors)
        const bentar = new THREE.Group();
        bentar.position.set(-11.5, isl.top + 0.8, 11.2);
        bentar.rotation.y = 0.8;
        // Sayap Gerbang Kiri
        bentar.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.9, 3.4, 0.9, -1.2, 1.7, 0));
        bentar.add(makeMesh(geoLib.cone4, matLib.candiStone, 0.85, 1.4, 0.85, -1.2, 4.1, 0));
        bentar.add(makeMesh(geoLib.sph, matLib.gold, 0.12, 0.18, 0.12, -1.2, 4.9, 0));
        // Sayap Gerbang Kanan
        bentar.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.9, 3.4, 0.9, 1.2, 1.7, 0));
        bentar.add(makeMesh(geoLib.cone4, matLib.candiStone, 0.85, 1.4, 0.85, 1.2, 4.1, 0));
        bentar.add(makeMesh(geoLib.sph, matLib.gold, 0.12, 0.18, 0.12, 1.2, 4.9, 0));
        // Sepasang Arca Dwarapala Penjaga Bentar
        bentar.add(makeMesh(geoLib.cyl6, matLib.candiStoneWarm, 0.18, 0.65, 0.18, -1.9, 0.45, 0.5));
        bentar.add(makeMesh(geoLib.sph, matLib.candiStoneWarm, 0.15, 0.18, 0.15, -1.9, 0.85, 0.5));
        bentar.add(makeMesh(geoLib.cyl6, matLib.candiStoneWarm, 0.18, 0.65, 0.18, 1.9, 0.45, 0.5));
        bentar.add(makeMesh(geoLib.sph, matLib.candiStoneWarm, 0.15, 0.18, 0.15, 1.9, 0.85, 0.5));
        g.add(bentar);

        // 3. TAMAN RERUNTUHAN CANDI & LAPIDARIUM BATU PURBAKALA (Scattered Carved Temple Blocks on Lawn)
        const makeLapidarium = (lx, lz, rotY) => {
          const lGroup = new THREE.Group();
          lGroup.position.set(lx, isl.top + 0.8, lz);
          lGroup.rotation.y = rotY;
          // Stacked carved stone blocks
          lGroup.add(makeMesh(geoLib.box, matLib.candiStone, 1.4, 0.55, 1.0, 0, 0.28, 0));
          lGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.0, 0.45, 0.8, -0.2, 0.75, 0.1));
          lGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.7, 0.35, 0.6, 0.8, 0.2, -0.3));
          lGroup.add(makeMesh(geoLib.cone4, matLib.candiStone, 0.45, 0.6, 0.45, -0.1, 1.25, 0.05)); // Ratna puncak reruntuhan
          // Lumut & Semak Bunga Kamboja
          lGroup.add(makeMesh(geoLib.ico, matLib.candiMoss, 0.8, 0.4, 0.8, 0.7, 0.25, 0.5));
          lGroup.add(makeMesh(geoLib.ico, matLib.flower, 0.45, 0.35, 0.45, -0.8, 0.3, -0.4));
          return lGroup;
        };
        g.add(makeLapidarium(-11.5, -4.5, 0.4));  // West lawn
        g.add(makeLapidarium(11.5, -5.5, -0.6));  // East lawn
        g.add(makeLapidarium(10.5, 5.0, 0.8));    // Southeast lawn
        g.add(makeLapidarium(-5.5, 11.5, -0.3));  // Southwest lawn

        // 4. BALE PENEDUH / GAZEBO KAYU JATI WISATAWAN (Resting Pavilion on the East Lawn)
        const gazebo = new THREE.Group();
        gazebo.position.set(12.0, isl.top + 0.8, -1.0);
        gazebo.rotation.y = -0.5;
        // Batur lantai batu
        gazebo.add(makeMesh(geoLib.box, matLib.stone, 3.6, 0.3, 3.6, 0, 0.15, 0));
        gazebo.add(makeMesh(geoLib.box, matLib.wood, 3.2, 0.15, 3.2, 0, 0.35, 0));
        // 4 Tiang Kayu Jati
        [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([px, pz]) => {
          gazebo.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 2.2, 0.08, px, 1.45, pz));
        });
        // Atap Limasan Peneduh Sirap
        gazebo.add(makeMesh(geoLib.cone4, matLib.roof, 4.2, 1.5, 4.2, 0, 3.1, 0));
        gazebo.add(makeMesh(geoLib.sph, matLib.gold, 0.15, 0.22, 0.15, 0, 4.0, 0));
        // Bangku Kayu Keliling di Dalam Gazebo
        gazebo.add(makeMesh(geoLib.box, matLib.wood, 2.6, 0.08, 0.35, 0, 0.65, -1.2));
        gazebo.add(makeMesh(geoLib.box, matLib.wood, 2.6, 0.08, 0.35, 0, 0.65, 1.2));
        g.add(gazebo);

        // 5. KOLAM AIR TERATAI MINI (Lotus Basin with Pink Water Lilies on the West Lawn)
        const lotusPond = new THREE.Group();
        lotusPond.position.set(-11.0, isl.top + 0.8, 2.5);
        // Stone basin rim
        lotusPond.add(makeMesh(geoLib.cyl12, matLib.candiStoneDark, 2.2, 0.45, 2.2, 0, 0.25, 0));
        lotusPond.add(makeMesh(geoLib.cyl12, matLib.poolWater, 1.9, 0.3, 1.9, 0, 0.38, 0));
        // Lotus leaves and flowers
        for (let lf = 0; lf < 4; lf++) {
          const la = (lf / 4) * Math.PI * 2 + 0.2;
          const lx = Math.cos(la) * 0.9;
          const lz = Math.sin(la) * 0.9;
          lotusPond.add(makeMesh(geoLib.cyl6, matLib.leaf, 0.4, 0.04, 0.4, lx, 0.52, lz));
          lotusPond.add(makeMesh(geoLib.ico, matLib.flower, 0.18, 0.18, 0.18, lx, 0.62, lz));
        }
        g.add(lotusPond);

        // 6. PAPAN PETUNJUK ARAH KAYU JOGJA (Rustic Wooden Directional Signpost)
        const signPost = new THREE.Group();
        signPost.position.set(-8.5, isl.top + 0.8, 8.5);
        signPost.rotation.y = 0.4;
        signPost.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.06, 2.4, 0.06, 0, 1.2, 0));
        // Plang panah arah 1 (Candi Siwa)
        const arrow1 = makeMesh(geoLib.box, matLib.cream, 1.2, 0.24, 0.06, 0.4, 2.0, 0);
        signPost.add(arrow1);
        // Plang panah arah 2 (Pelataran)
        const arrow2 = makeMesh(geoLib.box, matLib.cream, 1.1, 0.24, 0.06, -0.35, 1.6, 0);
        arrow2.rotation.y = 0.5;
        signPost.add(arrow2);
        g.add(signPost);

        // 7. POHON KAMBOJA & POHON BODHI RINDANG (Varied, Dense, Beautiful Foliage)
        addTree(g, -13.5, isl.top + 0.8, -9.0, 1.4, false); // Northwest lobe big Bodhi
        addTree(g, -8.5, isl.top + 0.8, -12.0, 1.1, false);
        addTree(g, 13.5, isl.top + 0.8, -9.5, 1.35, false); // Northeast lobe big Bodhi
        addTree(g, 8.5, isl.top + 0.8, -12.5, 1.15, true);
        addTree(g, 14.5, isl.top + 0.8, 2.0, 1.05, false);
        addTree(g, -14.0, isl.top + 0.8, 6.5, 1.15, true);
        addTree(g, 5.5, isl.top + 0.8, 12.5, 1.25, false);  // Southeast lobe
        addTree(g, -4.5, isl.top + 0.8, 14.0, 1.0, false);
        addTree(g, 0.0, isl.top + 0.8, -11.0, 1.3, true);   // North behind main temple

        // Semak Bunga Kamboja & Melati (Flower Blossom Clusters across the lawn)
        [
          [-6.5, 0.9, 7.5], [6.5, 0.9, 7.5],
          [-10.5, 0.9, -1.0], [10.5, 0.9, -1.0],
          [-2.5, 0.9, 13.0], [3.5, 0.9, 13.0]
        ].forEach(([fx, fy, fz]) => {
          g.add(makeMesh(geoLib.ico, matLib.flower, 0.8, 0.5, 0.8, fx, isl.top + fy, fz));
          g.add(makeMesh(geoLib.ico, matLib.leaf2, 0.9, 0.55, 0.9, fx + 0.3, isl.top + fy - 0.1, fz + 0.2));
        });

        // Scattered Andesite Boulders on Triangular Ridges with Kamboja Blossoms
        const boulderPts = [[-13, 0.4, -6], [13.5, 0.3, -7], [0, 0.5, 14.5], [-8, 0.1, 10], [9, 0.2, 9]];
        boulderPts.forEach(([bx, by, bz]) => {
          g.add(makeMesh(geoLib.ico, matLib.candiStoneDark, 1.3, 0.9, 1.4, bx, isl.top + by, bz));
          g.add(makeMesh(geoLib.sph, matLib.flower, 0.35, 0.2, 0.35, bx + 0.6, isl.top + by + 0.4, bz + 0.3));
        });
      } else if (isl.kind === 'library') {
        // Istana Air Tamansari (Umbul Pasiraman & Menara Penginap)
        const tsGroup = new THREE.Group();
        tsGroup.position.set(0, isl.top + 0.8, 0);
        tsGroup.rotation.y = 0.3;

        // Circular Turquoise Water Moat canal surrounding the island
        const moatGeo = new THREE.RingGeometry(isl.r * 0.52, isl.r * 0.86, 36);
        const moatMesh = new THREE.Mesh(moatGeo, matLib.poolWater);
        moatMesh.rotation.x = -Math.PI / 2;
        moatMesh.position.set(0, isl.top + 0.74, 0);
        g.add(moatMesh);

        // Floating Water Lily Pads and Lotus Flowers in the Moat
        for (let l = 0; l < 8; l++) {
          const lAngle = (l / 8) * Math.PI * 2 + 0.3;
          const lDist = isl.r * 0.70 + (Math.sin(l * 3.0) * 1.2);
          const lx = Math.cos(lAngle) * lDist;
          const lz = Math.sin(lAngle) * lDist;
          const pad = makeMesh(geoLib.cyl6, matLib.leaf, 0.55, 0.04, 0.55, lx, isl.top + 0.77, lz);
          const lotus = makeMesh(geoLib.ico, matLib.flower, 0.22, 0.25, 0.22, lx, isl.top + 0.90, lz);
          g.add(pad, lotus);
        }

        // Sandstone / Terracotta Courtyard Platform
        tsGroup.add(makeMesh(geoLib.box, matLib.cream, 15.0, 0.6, 12.0, 0, 0.3, 0));
        tsGroup.add(makeMesh(geoLib.box, matLib.terracotta, 14.2, 0.2, 11.2, 0, 0.65, 0));

        // 1. Umbul Pasiraman Royal Bathing Pools (Two Turquoise Water Basins)
        const pool1 = makeMesh(geoLib.box, matLib.poolWater, 5.0, 0.25, 4.2, -3.2, 0.6, 1.5);
        const pool2 = makeMesh(geoLib.box, matLib.poolWater, 5.0, 0.25, 4.2, 3.2, 0.6, 1.5);
        tsGroup.add(pool1, pool2);

        // Stone borders / coping around pools
        tsGroup.add(makeMesh(geoLib.box, matLib.cream, 5.4, 0.45, 0.4, -3.2, 0.75, -0.8));
        tsGroup.add(makeMesh(geoLib.box, matLib.cream, 5.4, 0.45, 0.4, -3.2, 0.75, 3.8));
        tsGroup.add(makeMesh(geoLib.box, matLib.cream, 5.4, 0.45, 0.4, 3.2, 0.75, -0.8));
        tsGroup.add(makeMesh(geoLib.box, matLib.cream, 5.4, 0.45, 0.4, 3.2, 0.75, 3.8));

        // Carved Stone Dragon Fountains (Pancuran Air Naga dengan Semburan Air)
        const fountain1 = makeMesh(geoLib.cyl12, matLib.stone, 0.3, 0.7, 0.3, -3.2, 0.9, -0.6);
        const spout1 = makeMesh(geoLib.cone4, matLib.gold, 0.15, 0.4, 0.15, -3.2, 1.1, -0.3);
        spout1.rotation.x = Math.PI / 3;
        const waterJet1 = makeMesh(geoLib.cyl6, matLib.poolWater, 0.05, 1.2, 0.05, -3.2, 0.8, 0.3);
        waterJet1.rotation.x = Math.PI / 4;
        tsGroup.add(fountain1, spout1, waterJet1);

        const fountain2 = makeMesh(geoLib.cyl12, matLib.stone, 0.3, 0.7, 0.3, 3.2, 0.9, -0.6);
        const spout2 = makeMesh(geoLib.cone4, matLib.gold, 0.15, 0.4, 0.15, 3.2, 1.1, -0.3);
        spout2.rotation.x = Math.PI / 3;
        const waterJet2 = makeMesh(geoLib.cyl6, matLib.poolWater, 0.05, 1.2, 0.05, 3.2, 0.8, 0.3);
        waterJet2.rotation.x = Math.PI / 4;
        tsGroup.add(fountain2, spout2, waterJet2);

        // Arched Stone Bridge dividing the two pools
        tsGroup.add(makeMesh(geoLib.box, matLib.cream, 1.4, 0.65, 4.6, 0, 0.85, 1.5));
        tsGroup.add(makeMesh(geoLib.cyl6, matLib.terracotta, 0.12, 0.8, 0.12, -0.6, 1.25, 0));
        tsGroup.add(makeMesh(geoLib.cyl6, matLib.terracotta, 0.12, 0.8, 0.12, 0.6, 1.25, 0));
        tsGroup.add(makeMesh(geoLib.cyl6, matLib.terracotta, 0.12, 0.8, 0.12, -0.6, 1.25, 3.0));
        tsGroup.add(makeMesh(geoLib.cyl6, matLib.terracotta, 0.12, 0.8, 0.12, 0.6, 1.25, 3.0));

        // 2. Menara Penginap (Sultan's 3-Tier Portuguese-Javanese Baroque Watchtower)
        const towerGroup = new THREE.Group();
        towerGroup.position.set(0, 0.7, -3.2);

        // Tier 1 (Ground Portal)
        towerGroup.add(makeMesh(geoLib.box, matLib.cream, 4.4, 2.6, 4.0, 0, 1.3, 0));
        // Arched Gateway Portal
        towerGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 1.5, 2.0, 0.3, 0, 1.0, 2.05));
        towerGroup.add(makeMesh(geoLib.prism, matLib.roof, 4.6, 0.4, 4.2, 0, 2.7, 0));

        // Tier 2 (Royal Viewing Chamber & Projecting Balcony)
        towerGroup.add(makeMesh(geoLib.box, matLib.cream, 3.6, 2.2, 3.2, 0, 3.8, 0));
        // Projecting Balustrade Balcony facing south over the pools
        towerGroup.add(makeMesh(geoLib.box, matLib.cream, 2.8, 0.25, 0.9, 0, 2.8, 2.05));
        towerGroup.add(makeMesh(geoLib.box, matLib.terracotta, 2.8, 0.5, 0.08, 0, 3.15, 2.45));
        // Arched Viewing Windows
        for (let wi = -1; wi <= 1; wi += 2) {
          const win = makeMesh(geoLib.box, matLib.window, 0.8, 1.2, 0.15, wi * 1.0, 4.0, 1.62);
          towerGroup.add(win);
        }
        towerGroup.add(makeMesh(geoLib.prism, matLib.roof, 3.8, 0.35, 3.4, 0, 5.0, 0));

        // Tier 3 (Pavilion Belvédère & Octagonal Turret)
        towerGroup.add(makeMesh(geoLib.cyl12, matLib.cream, 1.4, 1.8, 1.4, 0, 5.9, 0));
        // Conical Terracotta Pavilion Roof & Golden Pinnacle
        towerGroup.add(makeMesh(geoLib.cone7, matLib.roof, 1.8, 1.4, 1.8, 0, 7.3, 0));
        towerGroup.add(makeMesh(geoLib.sph, matLib.gold, 0.22, 0.35, 0.22, 0, 8.1, 0));

        makeGlow(towerGroup, 0, 4.0, 1.0, 8.0, '#ffd899');
        tsGroup.add(towerGroup);

        // 3. Gapura Panggung / Gapura Agung (Ornate Baroque South Gateway)
        const gapuraTamansari = new THREE.Group();
        gapuraTamansari.position.set(0, 0.6, 5.4);
        gapuraTamansari.add(makeMesh(geoLib.box, matLib.cream, 1.2, 3.0, 0.8, -1.8, 1.5, 0)); // Tiang kiri
        gapuraTamansari.add(makeMesh(geoLib.box, matLib.cream, 1.2, 3.0, 0.8, 1.8, 1.5, 0)); // Tiang kanan
        gapuraTamansari.add(makeMesh(geoLib.box, matLib.cream, 4.6, 0.8, 0.9, 0, 3.4, 0)); // Ambang atas
        // Sayap lengkung ornamen burung merak baroque
        gapuraTamansari.add(makeMesh(geoLib.cone4, matLib.terracotta, 0.45, 0.9, 0.45, -2.2, 3.6, 0));
        gapuraTamansari.add(makeMesh(geoLib.cone4, matLib.terracotta, 0.45, 0.9, 0.45, 2.2, 3.6, 0));
        gapuraTamansari.add(makeMesh(geoLib.sph, matLib.gold, 0.2, 0.3, 0.2, 0, 4.0, 0));
        tsGroup.add(gapuraTamansari);

        // Terracotta flower pots with bougainvillea along pool perimeter
        const potPositions = [[-6.0, -1.0], [6.0, -1.0], [-6.0, 3.5], [6.0, 3.5]];
        potPositions.forEach(([px, pz]) => {
          tsGroup.add(makeMesh(geoLib.cyl6, matLib.terracotta, 0.35, 0.5, 0.35, px, 0.9, pz));
          tsGroup.add(makeMesh(geoLib.ico, matLib.flower, 0.5, 0.45, 0.5, px, 1.3, pz));
        });

        // Ambient Water Mist Glow
        makeGlow(tsGroup, 0, 2.0, 1.5, 11.0, '#b8f2ea');
        g.add(tsGroup);

        // --- TAMAN SARI WATER PALACE ENRICHMENTS (Lush, Authentic & Connected) ---

        // 1. JEMBATAN LENGKUNG BATU KARST TAMANSARI (Arched Stone Bridge Crossing the Moat from Dock)
        const tsBridge = new THREE.Group();
        tsBridge.position.set(-2.2, isl.top + 0.74, 9.6);
        tsBridge.rotation.y = -0.42;
        // Stone Arched Footway
        tsBridge.add(makeMesh(geoLib.box, matLib.cream, 2.8, 0.35, 7.8, 0, 0.2, 0));
        tsBridge.add(makeMesh(geoLib.box, matLib.terracotta, 2.4, 0.1, 7.6, 0, 0.4, 0)); // Terracotta walking tile
        // Arched Stone Piers in Water
        tsBridge.add(makeMesh(geoLib.cyl12, matLib.stone, 0.7, 1.8, 0.7, -1.1, -0.6, -1.6));
        tsBridge.add(makeMesh(geoLib.cyl12, matLib.stone, 0.7, 1.8, 0.7, 1.1, -0.6, -1.6));
        tsBridge.add(makeMesh(geoLib.cyl12, matLib.stone, 0.7, 1.8, 0.7, -1.1, -0.6, 1.6));
        tsBridge.add(makeMesh(geoLib.cyl12, matLib.stone, 0.7, 1.8, 0.7, 1.1, -0.6, 1.6));
        // Balustrade Walls with Decorative Urn Lanterns
        tsBridge.add(makeMesh(geoLib.box, matLib.cream, 0.25, 0.65, 7.8, -1.3, 0.7, 0));
        tsBridge.add(makeMesh(geoLib.box, matLib.cream, 0.25, 0.65, 7.8, 1.3, 0.7, 0));
        [-2.8, 0, 2.8].forEach((bz) => {
          [-1.3, 1.3].forEach((bx) => {
            tsBridge.add(makeMesh(geoLib.cyl6, matLib.terracotta, 0.2, 0.35, 0.2, bx, 1.15, bz));
            tsBridge.add(makeMesh(geoLib.sph, matLib.gold, 0.1, 0.1, 0.1, bx, 1.35, bz));
          });
        });
        g.add(tsBridge);

        // 2. BALE KAMBANG (Royal Floating Water Pavilion in the Eastern Moat)
        const baleKambang = new THREE.Group();
        baleKambang.position.set(8.2, isl.top + 0.76, 4.8);
        baleKambang.rotation.y = -0.55;
        // Stone foundation plinth resting in the water
        baleKambang.add(makeMesh(geoLib.box, matLib.stone, 4.4, 0.5, 4.4, 0, 0.25, 0));
        baleKambang.add(makeMesh(geoLib.box, matLib.terracotta, 4.0, 0.15, 4.0, 0, 0.55, 0));
        // 4 White Baroque Pillars
        [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([px, pz]) => {
          baleKambang.add(makeMesh(geoLib.cyl12, matLib.cream, 0.18, 2.4, 0.18, px, 1.8, pz));
          baleKambang.add(makeMesh(geoLib.box, matLib.terracotta, 0.35, 0.2, 0.35, px, 3.0, pz));
        });
        // Piramida Atap Keraton Terracotta
        baleKambang.add(makeMesh(geoLib.cone4, matLib.roof, 4.8, 1.6, 4.8, 0, 3.8, 0));
        baleKambang.add(makeMesh(geoLib.sph, matLib.gold, 0.18, 0.25, 0.18, 0, 4.7, 0));
        // Hanging Baroque Water Lantern
        baleKambang.add(makeMesh(geoLib.sph, matLib.lamp, 0.22, 0.22, 0.22, 0, 2.5, 0, false));
        makeGlow(baleKambang, 0, 2.5, 0, 3.5, '#ffd28a');
        g.add(baleKambang);

        // 3. POHON PALEM RAJA (Royal Tropical Palms around Courtyard Perimeter)
        const addPalemRaja = (targetGroup, px, py, pz, pScale = 1.0) => {
          const palm = new THREE.Group();
          palm.position.set(px, py, pz);
          palm.scale.setScalar(pScale);
          // Ringed tall trunk
          palm.add(makeMesh(geoLib.cyl6, matLib.trunk, 0.22, 3.6, 0.22, 0, 1.8, 0));
          // Crownshaft (bright green neck)
          palm.add(makeMesh(geoLib.cyl12, matLib.pareanomGreen, 0.24, 0.9, 0.24, 0, 3.9, 0));
          // Spreading arching palm fronds
          for (let f = 0; f < 7; f++) {
            const fAngle = (f / 7) * Math.PI * 2;
            const frond = new THREE.Group();
            frond.position.set(0, 4.3, 0);
            frond.rotation.y = fAngle;
            frond.rotation.z = 0.55 + (f % 2) * 0.12;
            frond.add(makeMesh(geoLib.box, matLib.leaf, 0.25, 0.05, 2.4, 0, 0, 1.2));
            frond.add(makeMesh(geoLib.box, matLib.leaf2, 0.45, 0.04, 1.6, 0, 0, 1.0));
            palm.add(frond);
          }
          targetGroup.add(palm);
        };
        addPalemRaja(g, -8.5, isl.top + 0.8, 5.0, 1.2);
        addPalemRaja(g, 9.0, isl.top + 0.8, 1.5, 1.15);
        addPalemRaja(g, -8.0, isl.top + 0.8, -6.5, 1.1);
        addPalemRaja(g, 8.0, isl.top + 0.8, -6.0, 1.25);

        // 4. PAYUNG TEDUNG KERAJAAN DI TEPI KOLAM UMBUL PASIRAMAN
        [[-1.8, -0.6, '#ffd700'], [1.8, -0.6, '#b91c1c']].forEach(([ux, uz, ucol]) => {
          const uMat = new THREE.MeshStandardMaterial({ color: c(ucol), roughness: 0.5 });
          tsGroup.add(makeMesh(geoLib.cyl6, matLib.gold, 0.04, 2.2, 0.04, ux, 1.7, uz));
          tsGroup.add(makeMesh(geoLib.cone7, uMat, 0.65, 0.35, 0.65, ux, 2.7, uz));
          tsGroup.add(makeMesh(geoLib.sph, matLib.gold, 0.08, 0.12, 0.08, ux, 2.9, uz));
        });

        // 5. PAPAN PETUNJUK ARAH TAMANSARI
        const tsSign = new THREE.Group();
        tsSign.position.set(-3.5, isl.top + 0.8, 6.8);
        tsSign.rotation.y = 0.4;
        tsSign.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.06, 2.2, 0.06, 0, 1.1, 0));
        tsSign.add(makeMesh(geoLib.box, matLib.cream, 1.3, 0.25, 0.06, 0.4, 1.9, 0));
        tsSign.add(makeMesh(geoLib.box, matLib.terracotta, 1.1, 0.25, 0.06, -0.3, 1.5, 0));
        g.add(tsSign);

        // 6. TAMAN BUNGA BOUGAINVILLEA & KAMBOJA TAMANSARI
        [
          [-8.0, 0.9, -1.0], [8.0, 0.9, -1.0],
          [-4.5, 0.9, 7.5], [4.5, 0.9, 7.5],
          [-1.5, 0.9, -7.5], [1.5, 0.9, -7.5]
        ].forEach(([fx, fy, fz]) => {
          g.add(makeMesh(geoLib.ico, matLib.flower, 0.7, 0.45, 0.7, fx, isl.top + fy, fz));
          g.add(makeMesh(geoLib.ico, matLib.leaf2, 0.8, 0.5, 0.8, fx + 0.2, isl.top + fy - 0.1, fz + 0.15));
        });

        addTree(g, -7.5, isl.top + 0.8, 5, 1.05, false);
        addTree(g, 7.5, isl.top + 0.8, -4.5, 0.95, true);
        addTree(g, -7.0, isl.top + 0.8, -4.5, 0.9, false);
      } else if (isl.kind === 'beacon') {
        // Monumen Tugu Pal Putih Yogyakarta & Titik Nol Malioboro
        const tuguGroup = new THREE.Group();
        tuguGroup.position.set(0, isl.top + 0.8, 0);

        // Stepped Square Pedestal (Prasasti Undak Tugu dengan Sudut Kurva Ornamen)
        tuguGroup.add(makeMesh(geoLib.box, matLib.white, 3.8, 0.5, 3.8, 0, 0.25, 0));
        tuguGroup.add(makeMesh(geoLib.box, matLib.white, 3.0, 0.5, 3.0, 0, 0.75, 0));
        tuguGroup.add(makeMesh(geoLib.box, matLib.gold, 2.4, 0.25, 2.4, 0, 1.12, 0)); // Pelipit emas prasasti
        // 4 Sudut Kurva Penyangga Tugu (Corner decorative scroll volutes)
        const voluteDists = [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]];
        voluteDists.forEach(([vx, vz]) => {
          tuguGroup.add(makeMesh(geoLib.box, matLib.white, 0.5, 0.7, 0.5, vx, 0.85, vz));
          tuguGroup.add(makeMesh(geoLib.cone4, matLib.gold, 0.2, 0.45, 0.2, vx, 1.3, vz));
        });

        // Main Obelisk Column with gold filigree rings & Javanese script reliefs
        tuguGroup.add(makeMesh(geoLib.cyl12, matLib.white, 0.85, 9.5, 0.68, 0, 5.8, 0));
        tuguGroup.add(makeMesh(geoLib.cyl12, matLib.gold, 0.92, 0.28, 0.92, 0, 3.5, 0));
        tuguGroup.add(makeMesh(geoLib.cyl12, matLib.gold, 0.8, 0.28, 0.8, 0, 7.5, 0));

        // Golden Spire & Golong Gilig Sphere at summit
        tuguGroup.add(makeMesh(geoLib.cone4, matLib.gold, 0.75, 2.8, 0.75, 0, 11.5, 0));
        const beaconLight = makeMesh(geoLib.sph, matLib.beacon, 0.55, 0.55, 0.55, 0, 13.2, 0, false);
        tuguGroup.add(beaconLight);
        isl.beaconMesh = beaconLight;

        const beaconGlow = makeGlow(tuguGroup, 0, 13.2, 0, 7.5, '#FF4B1F');
        isl.beaconGlow = beaconGlow;

        // Rotating Twin Beacon Beams
        const beamGeo = new THREE.ConeGeometry(2.4, 75, 24, 1, true);
        beamGeo.translate(0, -37.5, 0);
        beamGeo.rotateZ(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
          color: c('#cfd8ff'),
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          fog: false
        });
        const beams = new THREE.Group();
        beams.position.set(0, 13.2, 0);
        const b1 = new THREE.Mesh(beamGeo, beamMat);
        const b2 = new THREE.Mesh(beamGeo, beamMat);
        b2.rotation.y = Math.PI;
        beams.add(b1, b2);
        tuguGroup.add(beams);
        isl.beaconBeams = beams;
        isl.beaconBeamMat = beamMat;

        // 1. Gedung Indische Titik Nol (Bank Indonesia & Kantor Pos Besar Malioboro Style)
        const gedungColonial = new THREE.Group();
        gedungColonial.position.set(-5.5, 0, -4.5);
        gedungColonial.rotation.y = 0.4;
        // Plinth & White Arcaded Wall
        gedungColonial.add(makeMesh(geoLib.box, matLib.cream, 6.5, 0.4, 4.0, 0, 0.2, 0));
        gedungColonial.add(makeMesh(geoLib.box, matLib.white, 6.0, 3.2, 3.6, 0, 1.8, 0));
        // Colonnade Arches (Arked Loggia Belanda)
        for (let ar = -2; ar <= 2; ar += 2) {
          gedungColonial.add(makeMesh(geoLib.box, matLib.window, 0.9, 1.8, 0.15, ar * 1.1, 1.6, 1.85));
          gedungColonial.add(makeMesh(geoLib.cyl6, matLib.white, 0.12, 2.2, 0.12, ar * 1.1 - 0.55, 1.6, 1.9));
        }
        // Classic Mansard / Hip Dutch Tile Roof (Atap Limasan Kolonial Belanda)
        gedungColonial.add(makeMesh(geoLib.prism, matLib.roof, 6.4, 1.8, 4.0, 0, 4.2, 0));
        // Little Clock Tower Cupola on Roof
        gedungColonial.add(makeMesh(geoLib.box, matLib.white, 1.2, 1.2, 1.2, 0, 5.3, 0));
        gedungColonial.add(makeMesh(geoLib.cone4, matLib.gold, 0.8, 1.0, 0.8, 0, 6.2, 0));
        gedungColonial.add(makeMesh(geoLib.sph, matLib.gold, 0.15, 0.15, 0.15, 0, 6.8, 0));
        tuguGroup.add(gedungColonial);

        // 2. Beringin Kembar Alun-Alun (Twin Sacred Banyan Trees with Pagar Sasak Putih)
        const makeBeringinKembar = (bx, bz) => {
          const bTreeGroup = new THREE.Group();
          bTreeGroup.position.set(bx, 0, bz);
          // Pagar Sasak Putih (White Square Enclosure Fence)
          bTreeGroup.add(makeMesh(geoLib.box, matLib.white, 2.6, 0.45, 0.1, 0, 0.35, -1.3));
          bTreeGroup.add(makeMesh(geoLib.box, matLib.white, 2.6, 0.45, 0.1, 0, 0.35, 1.3));
          bTreeGroup.add(makeMesh(geoLib.box, matLib.white, 0.1, 0.45, 2.6, -1.3, 0.35, 0));
          bTreeGroup.add(makeMesh(geoLib.box, matLib.white, 0.1, 0.45, 2.6, 1.3, 0.35, 0));
          // Manicured Round Banyan Foliage & Hanging Roots
          bTreeGroup.add(makeMesh(geoLib.cyl6, matLib.trunk, 0.35, 1.6, 0.35, 0, 0.8, 0));
          bTreeGroup.add(makeMesh(geoLib.sph, matLib.leaf, 1.8, 1.5, 1.8, 0, 2.4, 0));
          bTreeGroup.add(makeMesh(geoLib.sph, matLib.leaf2, 1.3, 1.2, 1.3, 0, 3.2, 0));
          // Hanging aerial roots
          bTreeGroup.add(makeMesh(geoLib.cyl6, matLib.trunk, 0.04, 1.2, 0.04, -0.6, 1.4, 0.4));
          bTreeGroup.add(makeMesh(geoLib.cyl6, matLib.trunk, 0.04, 1.2, 0.04, 0.6, 1.4, -0.4));
          return bTreeGroup;
        };
        tuguGroup.add(makeBeringinKembar(4.8, -3.2));

        // 3. Vintage Malioboro Dutch Cast-Iron Streetlamps (Lampu Antik Malioboro)
        const makeMalioboroLamp = (lx, lz) => {
          const lGroup = new THREE.Group();
          lGroup.position.set(lx, 0, lz);
          // Ornate green post with gold rings
          lGroup.add(makeMesh(geoLib.cyl6, matLib.malioboroGreen, 0.12, 3.2, 0.12, 0, 1.6, 0));
          lGroup.add(makeMesh(geoLib.box, matLib.gold, 0.35, 0.15, 0.35, 0, 0.5, 0));
          lGroup.add(makeMesh(geoLib.box, matLib.gold, 0.8, 0.08, 0.1, 0, 3.1, 0));
          // Dual spherical milk-glass lanterns
          lGroup.add(makeMesh(geoLib.sph, matLib.lamp, 0.22, 0.22, 0.22, -0.38, 3.2, 0, false));
          lGroup.add(makeMesh(geoLib.sph, matLib.lamp, 0.22, 0.22, 0.22, 0.38, 3.2, 0, false));
          makeGlow(lGroup, 0, 3.2, 0, 3.5, '#ffd285');
          return lGroup;
        };
        tuguGroup.add(makeMalioboroLamp(-3.8, 3.0));
        tuguGroup.add(makeMalioboroLamp(3.8, 3.0));

        // 4. Gerobak Angkringan Tradisional (Kopi Jos, Nasi Kucing & Wedang Jahe)
        const angkringan = new THREE.Group();
        angkringan.position.set(0, 0.1, 4.2);
        // Wooden cart body & two spoked wheels
        angkringan.add(makeMesh(geoLib.box, matLib.wood, 2.2, 0.6, 1.1, 0, 0.7, 0));
        angkringan.add(makeMesh(geoLib.cyl12, matLib.woodDark, 0.38, 0.08, 0.38, -0.85, 0.38, 0.55));
        angkringan.add(makeMesh(geoLib.cyl12, matLib.woodDark, 0.38, 0.08, 0.38, 0.85, 0.38, 0.55));
        // Striped canvas roof canopy
        angkringan.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.4, 0.04, -1.0, 1.5, -0.45));
        angkringan.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.04, 1.4, 0.04, 1.0, 1.5, -0.45));
        angkringan.add(makeMesh(geoLib.box, matLib.cream, 2.4, 0.08, 1.3, 0, 2.2, 0));
        // Charcoal Anglo stove and bronze water kettles (Ceret Kopi Jos)
        angkringan.add(makeMesh(geoLib.cyl12, matLib.rockDark, 0.22, 0.3, 0.22, -0.5, 1.15, 0));
        angkringan.add(makeMesh(geoLib.cyl12, matLib.gold, 0.16, 0.25, 0.16, -0.5, 1.4, 0));
        angkringan.add(makeMesh(geoLib.cyl12, matLib.gold, 0.15, 0.22, 0.15, 0.3, 1.12, 0));
        // Tampah Anyaman Nasi Kucing Daun Pisang (Banana Leaf Wrapped Rice Packets)
        angkringan.add(makeMesh(geoLib.box, matLib.woodDark, 0.6, 0.05, 0.5, 0.7, 1.03, 0));
        angkringan.add(makeMesh(geoLib.cone4, matLib.leaf, 0.12, 0.15, 0.12, 0.65, 1.12, -0.1));
        angkringan.add(makeMesh(geoLib.cone4, matLib.leaf, 0.12, 0.15, 0.12, 0.75, 1.12, 0.1));
        // Bangku Lincak Kayu Panjang (Wooden Bench for Customers)
        angkringan.add(makeMesh(geoLib.box, matLib.wood, 2.0, 0.08, 0.45, 0, 0.35, 1.1));
        angkringan.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.05, 0.35, 0.05, -0.85, 0.18, 1.1));
        angkringan.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.05, 0.35, 0.05, 0.85, 0.18, 1.1));
        // Glowing teplok lantern
        angkringan.add(makeMesh(geoLib.sph, matLib.lamp, 0.12, 0.16, 0.12, 0.8, 1.2, 0, false));
        makeGlow(angkringan, 0.8, 1.2, 0, 3.0, '#ffbe60');
        tuguGroup.add(angkringan);

        // 5. Plang Jalan Ikonik "Jl. Malioboro" (Tiang Hijau Besi Tempa dengan Aksara Jawa)
        const malioboroSign = new THREE.Group();
        malioboroSign.position.set(-2.6, 0.1, 4.8);
        malioboroSign.rotation.y = 0.25;
        malioboroSign.add(makeMesh(geoLib.cyl6, matLib.malioboroGreen, 0.08, 2.6, 0.08, 0, 1.3, 0));
        malioboroSign.add(makeMesh(geoLib.box, matLib.keratonGold, 0.2, 0.1, 0.2, 0, 0.3, 0));
        // Papan Nama Hijau Berlis Emas
        malioboroSign.add(makeMesh(geoLib.box, matLib.malioboroGreen, 1.6, 0.45, 0.08, 0.6, 2.3, 0));
        malioboroSign.add(makeMesh(geoLib.box, matLib.keratonGold, 1.65, 0.04, 0.09, 0.6, 2.52, 0));
        malioboroSign.add(makeMesh(geoLib.box, matLib.keratonGold, 1.65, 0.04, 0.09, 0.6, 2.08, 0));
        // Huruf Putih Simbolik "Jl. Malioboro" & Aksara Jawa
        malioboroSign.add(makeMesh(geoLib.box, matLib.white, 1.3, 0.12, 0.09, 0.6, 2.38, 0));
        malioboroSign.add(makeMesh(geoLib.box, matLib.keratonGold, 1.0, 0.08, 0.09, 0.6, 2.22, 0));
        tuguGroup.add(malioboroSign);

        // 6. Becak Kayuh Tradisional Khas Jogja (Iconic 3-Wheeled Jogja Pedicab)
        const becak = new THREE.Group();
        becak.position.set(-4.5, 0.1, 1.5);
        becak.rotation.y = 0.6;
        // 2 Roda Depan Besar
        becak.add(makeMesh(geoLib.cyl12, matLib.woodDark, 0.45, 0.06, 0.45, -0.65, 0.45, 0.6));
        becak.add(makeMesh(geoLib.cyl12, matLib.woodDark, 0.45, 0.06, 0.45, 0.65, 0.45, 0.6));
        // 1 Roda Belakang Pengayuh
        becak.add(makeMesh(geoLib.cyl12, matLib.woodDark, 0.4, 0.06, 0.4, 0, 0.4, -1.2));
        // Kabin Penumpang Depan (Hijau Malioboro & Oranye Keraton)
        becak.add(makeMesh(geoLib.box, matLib.malioboroGreen, 1.1, 0.4, 0.9, 0, 0.55, 0.4));
        becak.add(makeMesh(geoLib.box, matLib.roof, 0.95, 0.12, 0.5, 0, 0.62, 0.35));
        becak.add(makeMesh(geoLib.box, matLib.roof, 0.95, 0.4, 0.1, 0, 0.85, 0.1));
        // Tenda Kanvas Melengkung Becak
        const becakHood = makeMesh(geoLib.box, matLib.terracotta, 1.15, 0.06, 0.85, 0, 1.25, 0.3);
        becakHood.rotation.x = -0.25;
        becak.add(becakHood);
        // Rangka Pipa Besi & Sadel Pengemudi
        const bShaft = makeMesh(geoLib.cyl6, matLib.metal, 0.04, 1.4, 0.04, 0, 0.65, -0.5);
        bShaft.rotation.x = Math.PI / 3;
        becak.add(bShaft);
        becak.add(makeMesh(geoLib.box, matLib.woodDark, 0.28, 0.08, 0.28, 0, 0.95, -0.8)); // Sadel
        tuguGroup.add(becak);

        // 7. Kursi Taman Besi Hijau Malioboro (Cast-Iron Malioboro Bench)
        const malioboroBench = new THREE.Group();
        malioboroBench.position.set(2.8, 0.1, 4.2);
        malioboroBench.rotation.y = -0.4;
        malioboroBench.add(makeMesh(geoLib.box, matLib.malioboroGreen, 0.08, 0.5, 0.5, -0.9, 0.25, 0));
        malioboroBench.add(makeMesh(geoLib.box, matLib.malioboroGreen, 0.08, 0.5, 0.5, 0.9, 0.25, 0));
        malioboroBench.add(makeMesh(geoLib.box, matLib.woodDark, 2.0, 0.06, 0.45, 0, 0.45, 0));
        malioboroBench.add(makeMesh(geoLib.box, matLib.woodDark, 2.0, 0.4, 0.06, 0, 0.75, -0.22));
        tuguGroup.add(malioboroBench);

        // 8. Jalur Penyeberangan Zebra Cross & Promenade Pedestrian dari Dermaga ke Nol Km
        const nolSteps = 7;
        const nStartX = -0.4, nStartZ = 12.5;
        const nEndX = 0.0, nEndZ = 4.8;
        for (let s = 0; s <= nolSteps; s++) {
          const t = s / nolSteps;
          const nx = nStartX + (nEndX - nStartX) * t;
          const nz = nStartZ + (nEndZ - nStartZ) * t;
          // Paving Batu Pedestrian
          const pav = makeMesh(geoLib.box, matLib.stone, 2.6, 0.08, 1.2, nx, isl.top + 0.84, nz);
          g.add(pav);
          // Garis Putih Zebra Cross Penyeberangan
          if (s % 2 === 0) {
            g.add(makeMesh(geoLib.box, matLib.white, 2.2, 0.09, 0.35, nx, isl.top + 0.85, nz));
          }
          // Bollard Bola Hijau Malioboro (Cast-Iron Barrier Spheres)
          [-1.5, 1.5].forEach((bx) => {
            const bol = new THREE.Group();
            bol.position.set(nx + bx, isl.top + 0.84, nz);
            bol.add(makeMesh(geoLib.cyl6, matLib.malioboroGreen, 0.1, 0.5, 0.1, 0, 0.25, 0));
            bol.add(makeMesh(geoLib.sph, matLib.malioboroGreen, 0.16, 0.16, 0.16, 0, 0.55, 0));
            g.add(bol);
          });
        }

        // 9. Kotak Pos Merah Antik Titik Nol (Classic Dutch Cast-Iron Red Mailbox)
        const postBox = new THREE.Group();
        postBox.position.set(-3.2, isl.top + 0.8, -2.5);
        postBox.rotation.y = 0.3;
        postBox.add(makeMesh(geoLib.cyl12, matLib.candiStoneDark, 0.25, 0.15, 0.25, 0, 0.08, 0));
        postBox.add(makeMesh(geoLib.cyl12, matLib.royalRed, 0.22, 1.1, 0.22, 0, 0.7, 0));
        postBox.add(makeMesh(geoLib.sph, matLib.royalRed, 0.24, 0.2, 0.24, 0, 1.3, 0));
        postBox.add(makeMesh(geoLib.box, matLib.keratonGold, 0.2, 0.05, 0.08, 0, 0.95, 0.2)); // Lubang surat emas
        g.add(postBox);

        // 10. Pot Tanaman Pedestrian Malioboro dengan Bunga Marigold Kuning
        [
          [-2.8, 2.5], [2.8, 2.5], [-2.8, -1.0], [2.8, -1.0]
        ].forEach(([px, pz]) => {
          g.add(makeMesh(geoLib.box, matLib.terracotta, 0.6, 0.5, 0.6, px, isl.top + 1.05, pz));
          g.add(makeMesh(geoLib.ico, matLib.leaf, 0.5, 0.35, 0.5, px, isl.top + 1.45, pz));
          g.add(makeMesh(geoLib.sph, matLib.keratonGold, 0.2, 0.2, 0.2, px, isl.top + 1.65, pz));
        });

        // 11. Plang Kilometer Nol Yogyakarta
        const kmSign = new THREE.Group();
        kmSign.position.set(2.4, isl.top + 0.8, 6.2);
        kmSign.rotation.y = -0.5;
        kmSign.add(makeMesh(geoLib.cyl6, matLib.malioboroGreen, 0.08, 2.2, 0.08, 0, 1.1, 0));
        kmSign.add(makeMesh(geoLib.box, matLib.malioboroGreen, 1.4, 0.35, 0.08, 0, 1.8, 0));
        kmSign.add(makeMesh(geoLib.box, matLib.white, 1.1, 0.12, 0.09, 0, 1.8, 0));
        g.add(kmSign);

        g.add(tuguGroup);

        addTree(g, -5, isl.top + 0.8, 5, 0.9, true);
        addTree(g, 5, isl.top + 0.8, 5, 1.1, true);
        addTree(g, -5.5, isl.top + 0.8, -5.5, 1.05, false);
        addTree(g, 5.5, isl.top + 0.8, -5.5, 1.0, false);
      } else if (isl.kind === 'ratuboko') {
        // Candi Ratu Boko (Gerbang Paduraksa Tiga Pintu Megah & Keraton Abhayagiri)
        const boko = new THREE.Group();
        boko.position.set(0, isl.top + 0.8, 0);
        boko.rotation.y = -0.5;

        // 1. Pelataran Berundak Andesit (Terraced Andesite Courtyard)
        boko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 18.0, 0.6, 14.0, 0, 0.3, 0));
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 17.0, 0.4, 13.0, 0, 0.7, 0));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 16.2, 0.15, 12.2, 0, 0.95, 0));

        // 2. GERBANG PADURAKSA UTAMA RATU BOKO (Iconic 3-Portal Gate with True Open Passageways)
        const gateCenterZ = 0.5;

        // A. PINTU GERBANG UTAMA (Central Main Portal - Tallest, Hollow/Tembus Pandang)
        // Tiang Pilon Kiri Gerbang Utama
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 1.1, 4.4, 2.2, -1.65, 3.2, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.25, 0.5, 2.35, -1.65, 1.25, gateCenterZ)); // Umpak kaki pilon
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.25, 0.4, 2.35, -1.65, 5.2, gateCenterZ)); // Pelipit atas pilon

        // Tiang Pilon Kanan Gerbang Utama
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 1.1, 4.4, 2.2, 1.65, 3.2, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.25, 0.5, 2.35, 1.65, 1.25, gateCenterZ)); // Umpak kaki pilon
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.25, 0.4, 2.35, 1.65, 5.2, gateCenterZ)); // Pelipit atas pilon

        // Ambang Pintu / Balok Lintel Tengah (Menghubungkan kedua tiang, menyisakan lubang tembus pandang di bawahnya)
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 4.4, 0.75, 2.2, 0, 5.75, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 4.6, 0.25, 2.35, 0, 6.2, gateCenterZ));

        // Ukiran Kepala Kala (Kala Head Relief di atas ambang tengah menghadap depan)
        const kalaHead = makeMesh(geoLib.box, matLib.candiStoneAccent, 1.8, 0.85, 0.6, 0, 6.2, gateCenterZ + 1.2);
        boko.add(kalaHead);
        boko.add(makeMesh(geoLib.cone4, matLib.gold, 0.35, 0.45, 0.35, 0, 6.7, gateCenterZ + 1.2)); // Mahkota Kala emas

        // Atap Berundak Piramidal Gerbang Tengah (Stepped Roof Tiers)
        boko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 4.0, 0.65, 2.0, 0, 6.65, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 3.1, 0.6, 1.6, 0, 7.25, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 2.2, 0.5, 1.2, 0, 7.75, gateCenterZ));

        // Puncak Stupika Ratna Gerbang Tengah (5 Ratna Pinnacles)
        boko.add(makeMesh(geoLib.cone7, matLib.candiStoneAccent, 0.35, 1.5, 0.35, 0, 8.75, gateCenterZ)); // Stupika Utama
        boko.add(makeMesh(geoLib.sph, matLib.gold, 0.16, 0.25, 0.16, 0, 9.6, gateCenterZ)); // Ujung Emas
        const ratnaOffsets = [[-0.85, -0.45], [0.85, -0.45], [-0.85, 0.45], [0.85, 0.45]];
        ratnaOffsets.forEach(([rx, rz]) => {
          boko.add(makeMesh(geoLib.cone4, matLib.candiStoneDark, 0.22, 0.9, 0.22, rx, 8.2, gateCenterZ + rz));
        });

        // B. GERBANG SAYAP KIRI (Left Wing Portal - Hollow Passageway)
        const leftWingX = -3.8;
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 0.9, 3.2, 1.8, leftWingX - 1.0, 2.6, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.05, 0.4, 1.95, leftWingX - 1.0, 1.2, gateCenterZ));
        // Ambang Lintel Sayap Kiri
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 2.7, 0.6, 1.8, leftWingX, 4.5, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.1, 0.5, 0.4, leftWingX, 4.6, gateCenterZ + 1.0)); // Kala kecil
        // Atap Sayap Kiri
        boko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 2.4, 0.5, 1.5, leftWingX, 5.0, gateCenterZ));
        boko.add(makeMesh(geoLib.cone7, matLib.candiStoneAccent, 0.28, 1.1, 0.28, leftWingX, 5.75, gateCenterZ));
        boko.add(makeMesh(geoLib.sph, matLib.gold, 0.12, 0.18, 0.12, leftWingX, 6.35, gateCenterZ));

        // C. GERBANG SAYAP KANAN (Right Wing Portal - Hollow Passageway)
        const rightWingX = 3.8;
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 0.9, 3.2, 1.8, rightWingX + 1.0, 2.6, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.05, 0.4, 1.95, rightWingX + 1.0, 1.2, gateCenterZ));
        // Ambang Lintel Sayap Kanan
        boko.add(makeMesh(geoLib.box, matLib.candiStone, 2.7, 0.6, 1.8, rightWingX, 4.5, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.1, 0.5, 0.4, rightWingX, 4.6, gateCenterZ + 1.0)); // Kala kecil
        // Atap Sayap Kanan
        boko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 2.4, 0.5, 1.5, rightWingX, 5.0, gateCenterZ));
        boko.add(makeMesh(geoLib.cone7, matLib.candiStoneAccent, 0.28, 1.1, 0.28, rightWingX, 5.75, gateCenterZ));
        boko.add(makeMesh(geoLib.sph, matLib.gold, 0.12, 0.18, 0.12, rightWingX, 6.35, gateCenterZ));

        // D. DINDING PENGHUBUNG BERELIEF (Curtain Walls linking Gates)
        boko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.8, 3.0, 1.6, -2.6, 2.5, gateCenterZ));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.8, 3.0, 1.6, 2.6, 2.5, gateCenterZ));
        // Relung Arca Dinding
        boko.add(makeMesh(geoLib.box, matLib.candiStoneWarm, 0.5, 1.4, 0.3, -2.6, 2.5, gateCenterZ + 0.85));
        boko.add(makeMesh(geoLib.box, matLib.candiStoneWarm, 0.5, 1.4, 0.3, 2.6, 2.5, gateCenterZ + 0.85));

        // 3. TANGGA ANDESIT & PIPI TANGGA BERUKIR MAKARA (Staircases with Makara Balustrades)
        // Tangga Gerbang Tengah (5 Trap Anak Tangga)
        for (let st = 0; st < 5; st++) {
          const stepY = 0.2 + st * 0.18;
          const stepZ = gateCenterZ + 1.2 + (4 - st) * 0.45;
          boko.add(makeMesh(geoLib.box, matLib.candiStone, 2.4, 0.2, 0.5, 0, stepY, stepZ));
        }
        // Sepasang Pipi Tangga Berukir Makara (Makara Stone Balustrades with curled snout)
        const makeMakaraBalustrade = (mx) => {
          const mGroup = new THREE.Group();
          mGroup.position.set(mx, 0, gateCenterZ + 2.1);
          // Balustrade body stepping down
          mGroup.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.35, 1.1, 2.4, 0, 0.65, 0));
          mGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 0.45, 0.15, 2.5, 0, 1.25, 0));
          // Carved Makara Head Terminal (Moncong melengkung khas Mataram Kuno)
          mGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 0.45, 0.7, 0.6, 0, 0.55, 1.3));
          mGroup.add(makeMesh(geoLib.cone4, matLib.candiStoneWarm, 0.25, 0.55, 0.25, 0, 0.95, 1.35));
          mGroup.add(makeMesh(geoLib.sph, matLib.gold, 0.08, 0.08, 0.08, 0, 1.25, 1.35));
          return mGroup;
        };
        boko.add(makeMakaraBalustrade(-1.35));
        boko.add(makeMakaraBalustrade(1.35));

        // Tangga Gerbang Sayap Kiri & Kanan
        for (let st = 0; st < 3; st++) {
          boko.add(makeMesh(geoLib.box, matLib.candiStone, 1.6, 0.2, 0.45, leftWingX, 0.2 + st * 0.18, gateCenterZ + 1.0 + (2 - st) * 0.4));
          boko.add(makeMesh(geoLib.box, matLib.candiStone, 1.6, 0.2, 0.45, rightWingX, 0.2 + st * 0.18, gateCenterZ + 1.0 + (2 - st) * 0.4));
        }

        // 4. TERAS PASEBAN KERATON (Grid of Royal Column Umpaks behind the gate)
        const pasebanUmpaks = [
          [-3.0, -2.2], [-1.0, -2.2], [1.0, -2.2], [3.0, -2.2],
          [-3.0, -4.2], [-1.0, -4.2], [1.0, -4.2], [3.0, -4.2]
        ];
        pasebanUmpaks.forEach(([ux, uz]) => {
          boko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.7, 0.35, 0.7, ux, 1.15, uz));
          boko.add(makeMesh(geoLib.cyl6, matLib.candiStoneAccent, 0.25, 0.2, 0.25, ux, 1.4, uz));
        });

        // 5. CANDI PEMBAKARAN (Sacred Ash Hearth / Altar Platform)
        const pembakaran = new THREE.Group();
        pembakaran.position.set(-5.5, 1.0, -2.5);
        pembakaran.add(makeMesh(geoLib.box, matLib.candiStoneDark, 3.4, 0.8, 3.4, 0, 0.4, 0));
        pembakaran.add(makeMesh(geoLib.box, matLib.candiStone, 2.8, 0.4, 2.8, 0, 0.9, 0));
        // Lubang sumur abu persembahan (sunken hearth with glowing embers)
        pembakaran.add(makeMesh(geoLib.box, matLib.candiStoneDark, 1.4, 0.3, 1.4, 0, 1.15, 0));
        const fireLight = makeMesh(geoLib.sph, matLib.lamp, 0.3, 0.25, 0.3, 0, 1.35, 0, false);
        pembakaran.add(fireLight);
        makeGlow(pembakaran, 0, 1.4, 0, 4.0, '#ff7a1a');
        boko.add(pembakaran);

        // 6. UMBUL RATU BOKO (Ancient Royal Stone Bathing Pools)
        const kolamBoko = new THREE.Group();
        kolamBoko.position.set(5.2, 0.95, -2.6);
        // Stone boundary wall
        kolamBoko.add(makeMesh(geoLib.box, matLib.candiStoneDark, 4.6, 0.6, 3.8, 0, 0.3, 0));
        // Sunken turquoise water basin
        kolamBoko.add(makeMesh(geoLib.box, matLib.poolWater, 3.8, 0.25, 3.0, 0, 0.45, 0));
        // Inner stone stairs descending into bath
        for (let ks = 0; ks < 3; ks++) {
          kolamBoko.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.4, 0.15, 0.35, 0, 0.35 - ks * 0.1, 1.1 - ks * 0.35));
        }
        boko.add(kolamBoko);

        // 7. OBOR DIPA SENJA RATU BOKO (Flickering Sunset Torches on Stone Balusters)
        const torchPositions = [
          [-2.2, gateCenterZ + 3.2], [2.2, gateCenterZ + 3.2],
          [-4.5, gateCenterZ + 2.5], [4.5, gateCenterZ + 2.5]
        ];
        torchPositions.forEach(([tx, tz]) => {
          boko.add(makeMesh(geoLib.cyl6, matLib.candiStoneDark, 0.22, 1.6, 0.22, tx, 1.7, tz));
          boko.add(makeMesh(geoLib.cyl12, matLib.gold, 0.3, 0.15, 0.3, tx, 2.55, tz));
          boko.add(makeMesh(geoLib.sph, matLib.lamp, 0.22, 0.3, 0.22, tx, 2.75, tz, false));
          makeGlow(boko, tx, 2.75, tz, 4.5, '#ff8a2b');
        });

        // Atmospheric Sunset Glow shining directly through the hollow portal archway
        makeGlow(boko, 0, 4.5, gateCenterZ, 12.0, '#ff9e3b');
        g.add(boko);

        // Archaeological Boulders at Southwest Cliff Edge
        const bokoBoulders = [[-10.5, 0.4, 6.5], [-8, 0.2, 9.5], [-12, -0.5, 3.5], [-6, 0.3, 11]];
        bokoBoulders.forEach(([bx, by, bz]) => {
          g.add(makeMesh(geoLib.ico, matLib.candiStoneDark, 1.4, 1.0, 1.3, bx, isl.top + by, bz));
        });

        // --- TAMAN & SITUS PURBAKALA RATU BOKO (Lush Archaeological Park & Sunset Overlook) ---

        // 1. JALAN UNDAKAN ANDESIT UPACARA DARI DERMAGA KE TANGGA MAKARA
        const bokoSteps = 10;
        const bStartX = -13.5, bStartZ = 4.8; // Near dock
        const bEndX = 0.0, bEndZ = 4.2;       // In front of Makara stairs
        for (let bs = 0; bs <= bokoSteps; bs++) {
          const t = bs / bokoSteps;
          const bx = bStartX + (bEndX - bStartX) * t;
          const bz = bStartZ + (bEndZ - bStartZ) * t - Math.sin(t * Math.PI) * 1.5;
          const bStone = makeMesh(geoLib.box, matLib.candiStoneAccent, 2.4, 0.08, 1.5, bx, isl.top + 0.84, bz);
          bStone.rotation.y = Math.atan2(bEndX - bStartX, bEndZ - bStartZ);
          g.add(bStone);

          // Pasangan Obor Dipa Kuno Berdiri (Standing Andesite Torch Braziers)
          if (bs % 3 === 1) {
            const side = 1.7;
            const perpX = -Math.sin(bStone.rotation.y) * side;
            const perpZ = Math.cos(bStone.rotation.y) * side;
            [-1, 1].forEach((dir) => {
              const tx = bx + perpX * dir;
              const tz = bz + perpZ * dir;
              const torchG = new THREE.Group();
              torchG.position.set(tx, isl.top + 0.8, tz);
              torchG.add(makeMesh(geoLib.box, matLib.candiStoneDark, 0.45, 0.25, 0.45, 0, 0.12, 0));
              torchG.add(makeMesh(geoLib.cyl6, matLib.candiStone, 0.16, 1.1, 0.16, 0, 0.65, 0));
              torchG.add(makeMesh(geoLib.cyl12, matLib.candiStoneAccent, 0.35, 0.2, 0.35, 0, 1.25, 0));
              torchG.add(makeMesh(geoLib.sph, matLib.lamp, 0.2, 0.28, 0.2, 0, 1.45, 0, false));
              makeGlow(torchG, 0, 1.45, 0, 3.2, '#ff8a2b');
              g.add(torchG);
            });
          }
        }

        // 2. GARDU PANDANG SENJA TEBING BARAT (Famous Sunset Viewing Spot on Ratu Boko Cliff)
        const sunsetDeck = new THREE.Group();
        sunsetDeck.position.set(-10.5, isl.top + 0.8, -4.5);
        sunsetDeck.rotation.y = 0.4;
        // Pagar Pembatas Kayu Tebing
        sunsetDeck.add(makeMesh(geoLib.box, matLib.woodDark, 4.5, 0.8, 0.1, 0, 0.5, -1.8));
        sunsetDeck.add(makeMesh(geoLib.box, matLib.woodDark, 0.1, 0.8, 3.6, -2.25, 0.5, 0));
        // Sepasang Bangku Batu Andesit Menghadap Senja
        sunsetDeck.add(makeMesh(geoLib.box, matLib.candiStone, 1.8, 0.4, 0.5, -0.6, 0.2, -0.8));
        sunsetDeck.add(makeMesh(geoLib.box, matLib.candiStone, 1.8, 0.4, 0.5, 1.2, 0.2, -0.8));
        // Teropong Panorama Kuningan (Sunset Binoculars Stand)
        sunsetDeck.add(makeMesh(geoLib.cyl6, matLib.metal, 0.08, 1.3, 0.08, 0, 0.65, -1.4));
        const binoMesh = makeMesh(geoLib.box, matLib.gold, 0.2, 0.18, 0.45, 0, 1.35, -1.4);
        binoMesh.rotation.x = -0.15;
        sunsetDeck.add(binoMesh);
        // Lentera Senja Kuno
        sunsetDeck.add(makeMesh(geoLib.sph, matLib.lamp, 0.16, 0.22, 0.16, -1.8, 1.1, -1.8, false));
        makeGlow(sunsetDeck, -1.8, 1.1, -1.8, 3.0, '#ff9a3c');
        g.add(sunsetDeck);

        // 3. GOA PERTAPAAN / CERUK SEMEDI KUNO (Ancient Rock Hermitage Grotto)
        const goa = new THREE.Group();
        goa.position.set(10.0, isl.top + 0.8, 2.5);
        goa.rotation.y = -0.8;
        // Boulder Grotto Body
        goa.add(makeMesh(geoLib.ico, matLib.candiStoneDark, 3.4, 2.4, 3.2, 0, 1.1, 0));
        // Arched hollow entrance
        goa.add(makeMesh(geoLib.box, matLib.rockDark, 1.4, 1.6, 1.2, 0, 0.8, 1.4));
        // Mini Stone Stupa inside & incense offering
        goa.add(makeMesh(geoLib.cone4, matLib.candiStoneWarm, 0.35, 0.65, 0.35, 0, 0.35, 0.6));
        goa.add(makeMesh(geoLib.sph, matLib.lamp, 0.1, 0.1, 0.1, 0, 0.7, 0.6, false));
        makeGlow(goa, 0, 0.7, 0.6, 2.5, '#ffa245');
        g.add(goa);

        // 4. LAPIDARIUM RERUNTUHAN CANDI ABHAYAGIRI DI HALAMAN UTARA
        [
          [-4.5, -8.5, 0.5], [4.5, -8.5, -0.4], [10.5, -5.5, 0.8], [-11.0, 1.5, -0.3]
        ].forEach(([lx, lz, lrot]) => {
          const lGroup = new THREE.Group();
          lGroup.position.set(lx, isl.top + 0.8, lz);
          lGroup.rotation.y = lrot;
          lGroup.add(makeMesh(geoLib.box, matLib.candiStone, 1.3, 0.5, 0.9, 0, 0.25, 0));
          lGroup.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 0.9, 0.4, 0.7, -0.2, 0.65, 0.1));
          lGroup.add(makeMesh(geoLib.cone4, matLib.candiStoneDark, 0.35, 0.5, 0.35, 0.3, 0.45, -0.2));
          lGroup.add(makeMesh(geoLib.ico, matLib.candiMoss, 0.6, 0.3, 0.6, 0.5, 0.15, 0.3));
          lGroup.add(makeMesh(geoLib.ico, matLib.flower, 0.35, 0.25, 0.35, -0.5, 0.2, -0.3));
          g.add(lGroup);
        });

        // 5. PAPAN INFORMASI SITUS
        const bokoSign = new THREE.Group();
        bokoSign.position.set(-10.5, isl.top + 0.8, 6.5);
        bokoSign.rotation.y = 0.5;
        bokoSign.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.06, 2.2, 0.06, 0, 1.1, 0));
        bokoSign.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.5, 0.4, 0.08, 0, 1.8, 0));
        g.add(bokoSign);

        // 6. PEPOHONAN KAMBOJA & BODHI KHAS PERBUKITAN RATU BOKO
        addTree(g, -8, isl.top + 0.8, 5, 1.1, false);
        addTree(g, 8, isl.top + 0.8, -4, 0.9, true);
        addTree(g, -8, isl.top + 0.8, -4, 1.0, false);
        addTree(g, 10.5, isl.top + 0.8, -8.5, 1.3, false);
        addTree(g, -11.5, isl.top + 0.8, -8.5, 1.25, false);
        addTree(g, 11.5, isl.top + 0.8, 8.0, 1.1, true);
        addTree(g, -5.5, isl.top + 0.8, 9.5, 1.05, false);
        addTree(g, 4.5, isl.top + 0.8, 10.5, 1.15, false);
      } else if (isl.kind === 'breksi') {
        // Tebing Breksi & Hutan Pinus Mangunan (Tebing Karst Bertingkat & Ukir Naga Jawa Megah)
        const brek = new THREE.Group();
        brek.position.set(0, isl.top + 0.8, 0);

        // Monolithic Carved Limestone Quarry Pillars rising along the quarry edge
        const pillar1 = makeMesh(geoLib.box, matLib.limestone, 2.2, 7.5, 2.0, -11.5, 3.75, -2.5);
        pillar1.rotation.y = 0.2;
        const pillar2 = makeMesh(geoLib.box, matLib.limestone, 1.8, 6.2, 1.8, -10.5, 3.1, 3.0);
        pillar2.rotation.y = -0.3;
        g.add(pillar1, pillar2);

        // 1. DINDING TEBING KARST BEKAS TAMBANG PURBA (Layered Stratified Limestone Quarry)
        // Dinding Lapis Bawah (Tier 1 Quarry Wall)
        brek.add(makeMesh(geoLib.box, matLib.limestone, 14.5, 4.2, 7.2, -1.5, 2.1, -1.8));
        brek.add(makeMesh(geoLib.box, matLib.stone, 14.8, 0.4, 7.5, -1.5, 4.3, -1.8)); // Pelipit patahan batu
        // Dinding Lapis Atas (Tier 2 Quarry Wall)
        brek.add(makeMesh(geoLib.box, matLib.limestone, 12.0, 4.5, 5.0, -1.5, 6.4, -2.0));
        brek.add(makeMesh(geoLib.box, matLib.stone, 12.3, 0.35, 5.3, -1.5, 8.7, -2.0));
        // Tebing Puncak Gardu Pandang
        brek.add(makeMesh(geoLib.box, matLib.limestone, 8.5, 2.5, 3.8, -1.5, 9.95, -2.0));

        // 2. MAHARUPA UKIRAN NAGA MAHKOTA JAWA 3D (Monumental Sculpted Dragon Relief on Cliff Face)
        const naga = new THREE.Group();
        naga.position.set(-1.5, 5.2, 1.85);

        // Tubuh Berkelok Naga (Segmented undulating dragon torso)
        naga.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 2.2, 1.4, 0.9, 0, 0, 0)); // Dada naga
        naga.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.8, 1.1, 0.8, -1.8, -0.6, -0.2)); // Badan kiri meliuk
        naga.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.5, 0.9, 0.7, -3.2, -0.2, -0.4)); // Ekor kiri
        naga.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.8, 1.1, 0.8, 1.8, -0.5, -0.2)); // Badan kanan meliuk
        naga.add(makeMesh(geoLib.cone4, matLib.gold, 0.35, 1.1, 0.35, 3.1, -0.3, -0.3)); // Ujung ekor emas

        // Sayap / Sirip Sisik Naga (Flared Dragon Fins)
        const wingL = makeMesh(geoLib.cone7, matLib.keratonGold, 0.5, 1.6, 0.2, -1.2, 0.8, 0.1);
        wingL.rotation.z = -Math.PI / 4;
        const wingR = makeMesh(geoLib.cone7, matLib.keratonGold, 0.5, 1.6, 0.2, 1.2, 0.8, 0.1);
        wingR.rotation.z = Math.PI / 4;
        naga.add(wingL, wingR);

        // Kepala Naga Jawa Bermahkota Emas (Dragon Head with Golden Crown)
        naga.add(makeMesh(geoLib.box, matLib.candiStoneDark, 1.4, 1.2, 1.1, 0, 0.9, 0.25)); // Moncong & rahang
        naga.add(makeMesh(geoLib.cone4, matLib.keratonGold, 0.55, 1.5, 0.55, 0, 2.1, 0.25)); // Mahkota Raja Emas
        naga.add(makeMesh(geoLib.cone7, matLib.gold, 0.25, 0.7, 0.25, -0.65, 1.4, 0.4)); // Tanduk kiri
        naga.add(makeMesh(geoLib.cone7, matLib.gold, 0.25, 0.7, 0.25, 0.65, 1.4, 0.4)); // Tanduk kanan
        // Taring & Mata Naga
        naga.add(makeMesh(geoLib.sph, matLib.beacon, 0.12, 0.12, 0.12, -0.35, 1.1, 0.85)); // Mata bara kiri
        naga.add(makeMesh(geoLib.sph, matLib.beacon, 0.12, 0.12, 0.12, 0.35, 1.1, 0.85)); // Mata bara kanan
        naga.add(makeMesh(geoLib.cone4, matLib.white, 0.12, 0.35, 0.12, -0.4, 0.35, 0.75)); // Taring kiri
        naga.add(makeMesh(geoLib.cone4, matLib.white, 0.12, 0.35, 0.12, 0.4, 0.35, 0.75)); // Taring kanan
        brek.add(naga);

        // Relief Pahatan Wayang Kulit Semar pada Dinding Tebing (Carved Semar Stone Silhouette)
        const wayangSemar = new THREE.Group();
        wayangSemar.position.set(4.2, 5.6, 0.5);
        wayangSemar.add(makeMesh(geoLib.box, matLib.candiStoneAccent, 1.4, 1.8, 0.25, 0, 0, 0)); // Badan semar
        wayangSemar.add(makeMesh(geoLib.sph, matLib.candiStoneDark, 0.45, 0.45, 0.2, -0.35, 0.6, 0.05)); // Kepala kuncung
        wayangSemar.add(makeMesh(geoLib.cone4, matLib.gold, 0.15, 0.35, 0.15, -0.35, 0.95, 0.05));
        brek.add(wayangSemar);

        // 3. TANGGA AMFITEATER PAHATAN BATU & TEMPAT DUDUK MELINGKAR
        // Tribun Tempat Duduk Amfiteater Pahat Batu Breksi (Semicircular Stone Seating Ranks)
        for (let tr = 0; tr < 3; tr++) {
          const tRadius = 5.5 + tr * 1.2;
          const tSegments = 5;
          for (let ts = 0; ts < tSegments; ts++) {
            const ta = -0.6 + (ts / (tSegments - 1)) * 1.2;
            const tx = -1.5 + Math.sin(ta) * tRadius;
            const tz = 0.5 + Math.cos(ta) * tRadius * 0.45;
            brek.add(makeMesh(geoLib.box, matLib.limestone, 1.2, 0.3, 0.6, tx, 0.2 + tr * 0.25, tz));
          }
        }

        // Tangga Pahat Spiral ke Puncak
        for (let s = 0; s < 9; s++) {
          const stepW = 2.4 - s * 0.12;
          const stepH = 0.35;
          const stepY = 0.35 + s * 0.68;
          const stepX = 4.2 - (s > 4 ? (s - 4) * 0.6 : 0);
          const stepZ = 2.0 - s * 0.55;
          brek.add(makeMesh(geoLib.box, matLib.limestone, stepW, stepH, 0.85, stepX, stepY, stepZ));
          // Pagar batas batu
          if (s % 2 === 0) {
            brek.add(makeMesh(geoLib.cyl6, matLib.stone, 0.1, 0.6, 0.1, stepX + stepW * 0.5, stepY + 0.45, stepZ));
          }
        }

        // 4. GARDU PANDANG KAYU MANGUNAN (High Elevation Wooden Stilt Viewing Deck)
        const deck = new THREE.Group();
        deck.position.set(3.8, 0.6, 3.4);
        // Tiang kayu kokoh dengan palang silang diagonal
        deck.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.15, 3.2, 0.15, -1.3, 1.6, -1.1));
        deck.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.15, 3.2, 0.15, 1.3, 1.6, -1.1));
        deck.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.15, 3.2, 0.15, -1.3, 1.6, 1.1));
        deck.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.15, 3.2, 0.15, 1.3, 1.6, 1.1));
        // Lantai dek kayu & pagar pembatas
        deck.add(makeMesh(geoLib.box, matLib.wood, 3.2, 0.2, 2.8, 0, 3.2, 0));
        deck.add(makeMesh(geoLib.box, matLib.woodDark, 3.2, 0.65, 0.08, 0, 3.6, 1.35));
        deck.add(makeMesh(geoLib.box, matLib.woodDark, 3.2, 0.65, 0.08, 0, 3.6, -1.35));
        deck.add(makeMesh(geoLib.box, matLib.woodDark, 0.08, 0.65, 2.8, -1.55, 3.6, 0));
        // Lentera hangat gardu pandang
        deck.add(makeMesh(geoLib.sph, matLib.lamp, 0.18, 0.25, 0.18, 0, 4.1, 0, false));
        makeGlow(deck, 0, 4.1, 0, 4.0, '#ffe2a8');
        brek.add(deck);

        makeGlow(brek, -1.5, 6.0, 2.2, 10.0, '#f0f5ff');
        g.add(brek);

        // --- TEBING BREKSI & HUTAN PINUS MANGUNAN ENRICHMENTS ---

        // 1. JALAN SETAPAK PAHAT BATU BREKSI DARI DERMAGA KE AMFITEATER
        const breksiSteps = 9;
        const brStartX = 1.1, brStartZ = 14.5; // Near dock
        const brEndX = 0.0, brEndZ = 4.2;      // In front of amphitheater
        for (let s = 0; s <= breksiSteps; s++) {
          const t = s / breksiSteps;
          const bx = brStartX + (brEndX - brStartX) * t + Math.sin(t * Math.PI) * 1.2;
          const bz = brStartZ + (brEndZ - brStartZ) * t;
          const stepMesh = makeMesh(geoLib.box, matLib.limestone, 2.4, 0.1, 1.4, bx, isl.top + 0.84, bz);
          stepMesh.rotation.y = Math.atan2(brEndX - brStartX, brEndZ - brStartZ);
          g.add(stepMesh);
        }

        // 2. AREA API UNGGUN & NOOK SANTAI PINUS MANGUNAN
        const campNook = new THREE.Group();
        campNook.position.set(-7.5, isl.top + 0.8, 7.0);
        campNook.rotation.y = 0.5;
        // Meja Piknik Kayu Rimba & 2 Bangku Gelondongan
        campNook.add(makeMesh(geoLib.box, matLib.wood, 2.2, 0.1, 0.9, 0, 0.75, 0));
        campNook.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 0.7, 0.08, -0.9, 0.35, -0.3));
        campNook.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 0.7, 0.08, 0.9, 0.35, -0.3));
        campNook.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 0.7, 0.08, -0.9, 0.35, 0.3));
        campNook.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 0.7, 0.08, 0.9, 0.35, 0.3));
        campNook.add(makeMesh(geoLib.box, matLib.woodDark, 2.0, 0.08, 0.35, 0, 0.42, -0.65)); // Bangku kiri
        campNook.add(makeMesh(geoLib.box, matLib.woodDark, 2.0, 0.08, 0.35, 0, 0.42, 0.65));  // Bangku kanan
        // Api Unggun Melingkar Batu (Campfire with Glowing Embers)
        const firePit = new THREE.Group();
        firePit.position.set(0, 0, 2.0);
        for (let r = 0; r < 8; r++) {
          const fa = (r / 8) * Math.PI * 2;
          firePit.add(makeMesh(geoLib.ico, matLib.candiStoneDark, 0.25, 0.2, 0.25, Math.cos(fa) * 0.7, 0.1, Math.sin(fa) * 0.7));
        }
        // Kayu Bakar Silang
        const log1 = makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 0.9, 0.08, 0, 0.18, 0);
        log1.rotation.z = Math.PI / 4;
        const log2 = makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 0.9, 0.08, 0, 0.18, 0);
        log2.rotation.x = Math.PI / 4;
        firePit.add(log1, log2);
        firePit.add(makeMesh(geoLib.sph, matLib.lamp, 0.22, 0.28, 0.22, 0, 0.25, 0, false));
        makeGlow(firePit, 0, 0.25, 0, 3.8, '#ff7a1a');
        campNook.add(firePit);
        g.add(campNook);

        // 3. PAPAN PETUNJUK RIMBA MANGUNAN
        const brekSign = new THREE.Group();
        brekSign.position.set(3.2, isl.top + 0.8, 10.5);
        brekSign.rotation.y = -0.3;
        brekSign.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.07, 2.2, 0.07, 0, 1.1, 0));
        brekSign.add(makeMesh(geoLib.box, matLib.wood, 1.4, 0.28, 0.06, 0.45, 1.8, 0));
        brekSign.add(makeMesh(geoLib.box, matLib.wood, 1.2, 0.28, 0.06, -0.4, 1.4, 0));
        g.add(brekSign);

        // Deretan Hutan Pinus Mangunan (Dense Mountain Pine Forest)
        addTree(g, -6, isl.top + 0.8, 4, 1.3, true);
        addTree(g, -8, isl.top + 0.8, -3, 1.45, true);
        addTree(g, 6.5, isl.top + 0.8, -4, 1.35, true);
        addTree(g, 7.5, isl.top + 0.8, 4.5, 1.2, true);
        addTree(g, -3.5, isl.top + 0.8, 6.5, 1.15, true);
        addTree(g, -11.5, isl.top + 0.8, 5.5, 1.4, true);
        addTree(g, -9.5, isl.top + 0.8, -8.5, 1.35, true);
        addTree(g, 9.5, isl.top + 0.8, -8.5, 1.3, true);
        addTree(g, 11.5, isl.top + 0.8, 3.5, 1.25, true);
        addTree(g, -2.5, isl.top + 0.8, -9.5, 1.45, true);
      } else if (isl.kind === 'parangtritis') {
        // Pantai Parangtritis & Gumuk Pasir Barchan (Kawasan Samudra Kidul & Arena Sandboarding Jogja)
        const pantai = new THREE.Group();
        pantai.position.set(0, isl.top + 0.8, 0);

        // Helper: Pohon Cemara Udang Pesisir (Casuarina Equisetifolia Khas Gumuk Pasir Jogja)
        const addCemaraUdang = (targetGroup, px, py, pz, treeScale = 1.0, windLean = 0.4) => {
          const treeGroup = new THREE.Group();
          treeGroup.position.set(px, py, pz);

          const matFoliage1 = new THREE.MeshStandardMaterial({ color: c('#4d7049'), roughness: 0.85, flatShading: true });
          const matFoliage2 = new THREE.MeshStandardMaterial({ color: c('#5e8858'), roughness: 0.85, flatShading: true });
          const matFoliage3 = new THREE.MeshStandardMaterial({ color: c('#729e6b'), roughness: 0.85, flatShading: true });

          // Windswept curved trunk
          const b1 = makeMesh(geoLib.cyl6, matLib.woodDark, 0.2, 1.8, 0.2, 0, 0.8, 0);
          b1.rotation.z = windLean * 0.35;
          treeGroup.add(b1);
          const b2 = makeMesh(geoLib.cyl6, matLib.woodDark, 0.16, 1.6, 0.16, windLean * 0.4, 2.2, 0);
          b2.rotation.z = windLean * 0.65;
          treeGroup.add(b2);
          const b3 = makeMesh(geoLib.cyl6, matLib.woodDark, 0.12, 1.4, 0.12, windLean * 0.95, 3.4, 0);
          b3.rotation.z = windLean * 0.85;
          treeGroup.add(b3);

          // Clustered fluffy foliage puffs
          const puffs = [
            [windLean * 0.4, 2.4, -0.25, 0.75, 0.55, 0.75, matFoliage1],
            [windLean * 0.8, 3.1, 0.35, 0.95, 0.65, 0.95, matFoliage2],
            [windLean * 1.3, 3.8, -0.1, 0.9, 0.6, 0.9, matFoliage3],
            [windLean * 1.7, 4.4, 0.2, 0.75, 0.5, 0.75, matFoliage2],
            [windLean * 2.1, 4.9, 0.0, 0.6, 0.4, 0.6, matFoliage3]
          ];
          puffs.forEach(([fx, fy, fz, sx, sy, sz, mat]) => {
            treeGroup.add(makeMesh(geoLib.ico, mat, sx, sy, sz, fx, fy, fz));
          });

          treeGroup.scale.setScalar(treeScale);
          targetGroup.add(treeGroup);
          return treeGroup;
        };

        // Helper: Rumpun Rumput Pantai / Ilalang Pesisir (Coastal Beach Grass Tufts)
        const addBeachGrass = (targetGroup, gx, gy, gz, grassScale = 1.0) => {
          const grassMat = new THREE.MeshStandardMaterial({ color: c('#9ca874'), roughness: 0.9, flatShading: true });
          for (let b = 0; b < 4; b++) {
            const blade = makeMesh(geoLib.cone3, grassMat, 0.1, 0.9, 0.08, gx + (b - 1.5) * 0.15, gy + 0.4, gz + (Math.random() - 0.5) * 0.2);
            blade.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35 + 0.2);
            blade.scale.setScalar(grassScale);
            targetGroup.add(blade);
          }
        };

        // 1. JEEP WISATA OFFROAD 4x4 GUMUK PASIR JOGJA (Ikon Wisata Petualangan Gurun Parangkusumo)
        const jeep = new THREE.Group();
        jeep.position.set(2.8, 2.2, -2.4);
        jeep.rotation.set(0.12, -0.65, 0.08); // Angled dynamically perched on the sand ridge

        const matJeepBody = new THREE.MeshStandardMaterial({ color: c('#f59e0b'), roughness: 0.45 }); // Kuning Cerah Rally
        const matJeepChassis = new THREE.MeshStandardMaterial({ color: c('#1e293b'), roughness: 0.6 });
        const matTire = new THREE.MeshStandardMaterial({ color: c('#262626'), roughness: 0.9 });
        const matRim = new THREE.MeshStandardMaterial({ color: c('#fef08a'), roughness: 0.4 });
        const matWindshield = new THREE.MeshStandardMaterial({ color: c('#93c5fd'), roughness: 0.2, transparent: true, opacity: 0.75 });
        const matHeadlight = new THREE.MeshStandardMaterial({ color: c('#fffbeb'), emissive: c('#fef08a'), emissiveIntensity: 0.85, roughness: 0.2 });
        const matRollBar = new THREE.MeshStandardMaterial({ color: c('#334155'), roughness: 0.5 });
        const matSeat = new THREE.MeshStandardMaterial({ color: c('#78350f'), roughness: 0.7 });

        // Tub Bodi Utama & Kap Mesin Depan
        jeep.add(makeMesh(geoLib.box, matJeepBody, 2.3, 0.6, 4.2, 0, 0.7, 0));
        jeep.add(makeMesh(geoLib.box, matJeepBody, 2.0, 0.5, 1.8, 0, 1.25, 1.1));
        // Grille Depan & Headlights Bulat
        jeep.add(makeMesh(geoLib.box, matJeepChassis, 1.8, 0.42, 0.12, 0, 1.2, 2.05));
        jeep.add(makeMesh(geoLib.cyl6, matHeadlight, 0.2, 0.1, 0.2, -0.6, 1.22, 2.1));
        jeep.add(makeMesh(geoLib.cyl6, matHeadlight, 0.2, 0.1, 0.2, 0.6, 1.22, 2.1));
        // Bullbar Bumper Depan & Winch Derek
        jeep.add(makeMesh(geoLib.box, matJeepChassis, 2.4, 0.22, 0.35, 0, 0.58, 2.3));
        jeep.add(makeMesh(geoLib.cyl6, matJeepChassis, 0.14, 0.45, 0.14, 0, 0.65, 2.4));

        // Kaca Depan Miring & Frame
        const windshield = makeMesh(geoLib.box, matWindshield, 1.9, 0.85, 0.06, 0, 1.65, 0.2);
        windshield.rotation.x = -0.3;
        jeep.add(windshield);
        const wsFrame = makeMesh(geoLib.box, matJeepChassis, 2.0, 0.92, 0.04, 0, 1.65, 0.2);
        wsFrame.rotation.x = -0.3;
        jeep.add(wsFrame);

        // Kabin Terbuka & Kursi Bucket
        jeep.add(makeMesh(geoLib.box, matSeat, 0.7, 0.65, 0.65, -0.5, 1.05, -0.4));
        jeep.add(makeMesh(geoLib.box, matSeat, 0.7, 0.65, 0.65, 0.5, 1.05, -0.4));
        const stWheel = makeMesh(geoLib.cyl12, matJeepChassis, 0.22, 0.06, 0.22, 0.45, 1.4, 0.05);
        stWheel.rotation.x = 0.5;
        jeep.add(stWheel);

        // Roll Cage Pipa Peneduh Kabin Terbuka
        const cagePosts = [[-1.0, 1.75, -0.1], [1.0, 1.75, -0.1], [-1.0, 1.75, -1.7], [1.0, 1.75, -1.7]];
        cagePosts.forEach(([bx, by, bz]) => {
          jeep.add(makeMesh(geoLib.cyl6, matRollBar, 0.06, 1.45, 0.06, bx, by, bz));
        });
        jeep.add(makeMesh(geoLib.box, matRollBar, 0.09, 0.09, 1.7, -1.0, 2.45, -0.9));
        jeep.add(makeMesh(geoLib.box, matRollBar, 0.09, 0.09, 1.7, 1.0, 2.45, -0.9));
        jeep.add(makeMesh(geoLib.box, matRollBar, 2.1, 0.09, 0.09, 0, 2.45, -0.1));
        jeep.add(makeMesh(geoLib.box, matRollBar, 2.1, 0.09, 0.09, 0, 2.45, -1.7));

        // 3 Lampu Sorot Rally Atap
        [-0.55, 0, 0.55].forEach((lx) => {
          jeep.add(makeMesh(geoLib.cyl6, matHeadlight, 0.15, 0.1, 0.15, lx, 2.62, -0.1));
        });

        // 4 Roda Ban Pacul Off-Road & Velg
        const wheelPos = [[-1.2, 0.45, 1.2], [1.2, 0.45, 1.2], [-1.2, 0.45, -1.2], [1.2, 0.45, -1.2]];
        wheelPos.forEach(([wx, wy, wz]) => {
          const tire = makeMesh(geoLib.cyl12, matTire, 0.55, 0.35, 0.55, wx, wy, wz);
          tire.rotation.z = Math.PI / 2;
          jeep.add(tire);
          const rim = makeMesh(geoLib.cyl6, matRim, 0.3, 0.37, 0.3, wx, wy, wz);
          rim.rotation.z = Math.PI / 2;
          jeep.add(rim);
        });

        // Ban Serep Belakang
        const spare = makeMesh(geoLib.cyl12, matTire, 0.5, 0.26, 0.5, 0, 1.15, -2.15);
        spare.rotation.x = Math.PI / 2;
        jeep.add(spare);

        // Jejak Ban di Pasir (Tire Tracks)
        const trackL = makeMesh(geoLib.box, matLib.candiStoneWarm, 0.35, 0.04, 3.5, 0.8, -0.4, -3.2);
        trackL.rotation.y = -0.65;
        const trackR = makeMesh(geoLib.box, matLib.candiStoneWarm, 0.35, 0.04, 3.5, -0.8, -0.4, -3.2);
        trackR.rotation.y = -0.65;
        jeep.add(trackL, trackR);

        jeep.scale.setScalar(0.85);
        pantai.add(jeep);

        // 2. ARENA SANDBOARDING PARANGKUSUMO (Papan Seluncur Pasir & Pos Rental Kanvas)
        const sandboardHub = new THREE.Group();
        sandboardHub.position.set(-2.0, 2.4, -3.8);
        sandboardHub.rotation.y = 0.3;

        // Tiang Kayu Rustic & Tenda Kanvas Bergaris Oranye-Putih
        [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]].forEach(([px, pz]) => {
          sandboardHub.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.05, 2.4, 0.05, px, 1.2, pz));
        });
        const matCanopy = new THREE.MeshStandardMaterial({ color: c('#ea580c'), roughness: 0.5 });
        sandboardHub.add(makeMesh(geoLib.box, matCanopy, 2.9, 0.1, 2.1, 0, 2.38, 0));
        sandboardHub.add(makeMesh(geoLib.box, matLib.white, 2.8, 0.08, 2.0, 0, 2.44, 0));

        // Rak Sandboard & Deretan Papan Seluncur Warna-Warni
        const boardCols = ['#ef4444', '#06b6d4', '#eab308', '#8b5cf6'];
        boardCols.forEach((col, idx) => {
          const matB = new THREE.MeshStandardMaterial({ color: c(col), roughness: 0.4 });
          const b = makeMesh(geoLib.box, matB, 0.38, 1.6, 0.05, -0.8 + idx * 0.52, 0.95, 0.75);
          b.rotation.set(-0.25, 0, (idx - 1.5) * 0.08);
          sandboardHub.add(b);
          // Footstraps karet
          sandboardHub.add(makeMesh(geoLib.box, matLib.woodDark, 0.28, 0.08, 0.08, -0.8 + idx * 0.52, 1.2, 0.82));
          sandboardHub.add(makeMesh(geoLib.box, matLib.woodDark, 0.28, 0.08, 0.08, -0.8 + idx * 0.52, 0.7, 0.7));
        });
        pantai.add(sandboardHub);

        // Papan Sandboard Siap Meluncur di Puncak Lereng (Active Board on Slope)
        const activeBoard = makeMesh(geoLib.box, new THREE.MeshStandardMaterial({ color: c('#0284c7'), roughness: 0.4 }), 0.42, 1.75, 0.06, -4.5, 2.3, 0.8);
        activeBoard.rotation.set(0.35, 0.45, 0.2);
        pantai.add(activeBoard);

        // Bendera Start Slalom (Merah & Kuning pada Tiang Bambu)
        const flag1 = new THREE.Group();
        flag1.position.set(-3.2, 2.6, 1.8);
        flag1.add(makeMesh(geoLib.cyl6, matLib.wood, 0.04, 2.2, 0.04, 0, 1.1, 0));
        const f1 = makeMesh(geoLib.cone3, new THREE.MeshStandardMaterial({ color: c('#ef4444') }), 0.35, 0.55, 0.04, 0.22, 1.8, 0);
        f1.rotation.z = -Math.PI / 2;
        flag1.add(f1);
        pantai.add(flag1);

        const flag2 = new THREE.Group();
        flag2.position.set(-5.5, 2.4, 0.2);
        flag2.add(makeMesh(geoLib.cyl6, matLib.wood, 0.04, 2.2, 0.04, 0, 1.1, 0));
        const f2 = makeMesh(geoLib.cone3, new THREE.MeshStandardMaterial({ color: c('#eab308') }), 0.35, 0.55, 0.04, 0.22, 1.8, 0);
        f2.rotation.z = -Math.PI / 2;
        flag2.add(f2);
        pantai.add(flag2);

        // Lintasan Jalur Sandboard Meluncur Turun ke Lembah Pasir
        const sandRunway = makeMesh(geoLib.box, matLib.candiStoneWarm, 0.75, 0.04, 8.5, -5.2, 1.5, 1.2);
        sandRunway.rotation.set(0.18, 0.35, 0.08);
        pantai.add(sandRunway);

        // 3. SPOT FOTO AYUNAN KAYU GUMUK PASIR (Rustic Beach Swing Menghadap Langit)
        const swing = new THREE.Group();
        swing.position.set(5.8, 1.8, 2.4);
        swing.rotation.y = 1.15;

        // Tiang Kayu Gelondongan Miring & Balok Palang
        swing.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.09, 3.4, 0.09, -1.15, 1.6, 0));
        swing.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.09, 3.4, 0.09, 1.15, 1.6, 0));
        const swingCross = makeMesh(geoLib.cyl6, matLib.woodDark, 0.1, 2.7, 0.1, 0, 3.25, 0);
        swingCross.rotation.z = Math.PI / 2;
        swing.add(swingCross);

        // Plang Kayu Tulisan Ikonik "GUMUK PASIR"
        const signPlank = makeMesh(geoLib.box, matLib.cream, 1.6, 0.36, 0.06, 0, 3.62, 0);
        swing.add(signPlank);

        // Tali Tambang Gantung & Papan Dudukan Ayunan
        swing.add(makeMesh(geoLib.cyl6, matLib.wood, 0.02, 1.9, 0.02, -0.65, 2.15, 0));
        swing.add(makeMesh(geoLib.cyl6, matLib.wood, 0.02, 1.9, 0.02, 0.65, 2.15, 0));
        swing.add(makeMesh(geoLib.box, matLib.wood, 1.6, 0.08, 0.45, 0, 1.2, 0));
        pantai.add(swing);

        // 4. PETILASAN SAKRAL PARANGKUSUMO (Cungkup Kayu Jati & Batu Gilang)
        const pura = new THREE.Group();
        pura.position.set(4.2, 1.6, -5.2);
        pura.rotation.y = -0.4;
        pura.add(makeMesh(geoLib.box, matLib.candiStoneDark, 2.4, 0.4, 2.2, 0, 0.2, 0));
        // 4 Tiang Cungkup Kayu & Atap Tajug
        [[-0.9, -0.8], [0.9, -0.8], [-0.9, 0.8], [0.9, 0.8]].forEach(([cx, cz]) => {
          pura.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.07, 1.7, 0.07, cx, 1.1, cz));
        });
        pura.add(makeMesh(geoLib.cone4, matLib.roof, 2.4, 0.85, 2.1, 0, 2.3, 0));
        pura.add(makeMesh(geoLib.sph, matLib.gold, 0.14, 0.2, 0.14, 0, 2.8, 0));
        // Batu Gilang & Sepasang Payung Tedung Keraton
        pura.add(makeMesh(geoLib.box, matLib.candiStoneDark, 1.0, 0.6, 0.8, 0, 0.65, 0));
        pura.add(makeMesh(geoLib.cyl6, matLib.gold, 0.04, 1.8, 0.04, -1.1, 1.0, -0.3));
        pura.add(makeMesh(geoLib.cone7, matLib.white, 0.55, 0.35, 0.55, -1.1, 1.9, -0.3));
        pura.add(makeMesh(geoLib.cyl6, matLib.gold, 0.04, 1.8, 0.04, 1.1, 1.0, -0.3));
        pura.add(makeMesh(geoLib.cone7, matLib.keratonGold, 0.55, 0.35, 0.55, 1.1, 1.9, -0.3));
        makeGlow(pura, 0, 1.5, 0, 4.0, '#ffd88d');
        pantai.add(pura);

        // 5. VEGETASI KHAS PANTAI SELATAN: POHON CEMARA UDANG & RUMPUT PANTAI
        addCemaraUdang(pantai, -8.5, 0.4, -4.5, 1.15, 0.38);
        addCemaraUdang(pantai, -7.5, 1.1, 4.5, 0.95, 0.42);
        addCemaraUdang(pantai, 7.8, 0.8, -5.2, 1.05, -0.32);
        addCemaraUdang(pantai, 6.8, 1.1, 5.8, 0.9, 0.35);

        // Rumput Pantai / Ilalang Pesisir di Kaki Bukit Pasir
        [[-4.5, 0.6, -6.5], [-6.2, 0.8, 2.2], [3.5, 0.9, -6.8], [5.2, 1.2, 4.8], [-1.2, 1.4, 6.2]].forEach(([gx, gy, gz]) => {
          addBeachGrass(pantai, gx, gy, gz, 1.0);
        });

        // Plang Selamat Datang di Dermaga (Welcome Signboard)
        const welcomePost = new THREE.Group();
        welcomePost.position.set(isl.r * 0.72, 1.3, isl.r * 0.72);
        welcomePost.rotation.y = -0.78;
        welcomePost.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.07, 2.2, 0.07, 0, 1.0, 0));
        welcomePost.add(makeMesh(geoLib.box, matLib.cream, 1.5, 0.45, 0.08, 0, 1.7, 0));
        pantai.add(welcomePost);

        // Titian Papan Kayu Pesisir (Raised Wooden Boardwalk connecting Pier to Safari Jeep & Sandboard Hub)
        const dBoardSteps = 10;
        const dbStartX = isl.r * 0.72, dbStartZ = isl.r * 0.72; // Near dock
        const dbEndX = 0.5, dbEndZ = -2.0;                      // Center between Jeep and Hub
        for (let ds = 0; ds <= dBoardSteps; ds++) {
          const t = ds / dBoardSteps;
          const dx = dbStartX + (dbEndX - dbStartX) * t;
          const dz = dbStartZ + (dbEndZ - dbStartZ) * t - Math.sin(t * Math.PI) * 1.5;
          const plank = makeMesh(geoLib.box, matLib.wood, 2.2, 0.12, 1.1, dx, 1.35, dz);
          plank.rotation.y = Math.atan2(dbEndX - dbStartX, dbEndZ - dbStartZ);
          pantai.add(plank);

          // Pasak Kayu Penyangga di Pasir
          pantai.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 1.2, 0.08, dx - 1.0, 0.7, dz));
          pantai.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 1.2, 0.08, dx + 1.0, 0.7, dz));
        }

        // Spot Santai Gazebo Jerami Pantai Parangtritis (Thatched Straw Umbrella & Wooden Loungers)
        const beachNook = new THREE.Group();
        beachNook.position.set(-6.5, 1.8, -1.5);
        beachNook.rotation.y = 0.6;
        beachNook.add(makeMesh(geoLib.cyl6, matLib.woodDark, 0.08, 2.6, 0.08, 0, 1.3, 0));
        beachNook.add(makeMesh(geoLib.cone7, matLib.wood, 2.4, 0.85, 2.4, 0, 2.7, 0));
        beachNook.add(makeMesh(geoLib.sph, matLib.keratonGold, 0.12, 0.15, 0.12, 0, 3.2, 0));
        [-0.8, 0.8].forEach((lx) => {
          const lounge = makeMesh(geoLib.box, matLib.cream, 0.6, 0.1, 1.6, lx, 0.35, 0);
          lounge.rotation.x = -0.2;
          beachNook.add(lounge);
        });
        pantai.add(beachNook);

        // 6. CURAHAN PASIR BERJATUHAN GAYA GAME FUN (Stylized Game Sand Trickles & Tumbling 3D Grains)
        // A. Low-poly Sand Spill Tongue at cliff lip
        const sandChute = makeMesh(geoLib.box, matLib.sand, 2.8, 0.45, 1.8, 0.0, 0.22, isl.r * 0.88);
        sandChute.rotation.x = 0.35;
        pantai.add(sandChute);

        // B. Slender Vertical Sand Stream Shader (Pure downward vertical speed lines - NO horizontal wavy ripples!)
        const sandStreamMat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          fog: false,
          uniforms: { uTime: skyUniforms.uTime },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              // Pure vertical streaming sand speed-lines (like a fun stylized game / anime speed lines)
              float vSpeed = vUv.y * 11.0 + uTime * 4.6;

              // Vertical stream core (tapered cord)
              float strand = sin(vUv.x * 3.14159);
              float core = smoothstep(0.12, 0.55, strand);

              // Vertical dash lines & grains stretching downward
              float grain = step(0.28, fract(vSpeed + sin(vUv.x * 25.0) * 0.4));
              float micro = step(0.42, fract(vUv.y * 22.0 + uTime * 6.8));

              // Warm matte low-poly desert sand palette
              vec3 sandDark  = vec3(0.80, 0.60, 0.34);
              vec3 sandMid   = vec3(0.93, 0.77, 0.49);
              vec3 sandLight = vec3(1.00, 0.90, 0.68);

              vec3 col = mix(sandDark, sandMid, core);
              col = mix(col, sandLight, (grain * 0.45 + micro * 0.25) * core);

              // Vertical tapering: wide at top, tapering down to subtle fade
              float sideFade = pow(strand, 1.7);
              float dropFade = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.48, vUv.y);
              float alpha = sideFade * dropFade * 0.95;

              gl_FragColor = vec4(col, alpha);
            }
          `
        });

        // 3 Separate Slender Vertical Stream Ribbons
        const centerStreamGeo = new THREE.PlaneGeometry(0.85, 24, 1, 1);
        const centerStream = new THREE.Mesh(centerStreamGeo, sandStreamMat);
        centerStream.position.set(0, -11, isl.r * 0.90);
        pantai.add(centerStream);

        const leftStreamGeo = new THREE.PlaneGeometry(0.5, 18, 1, 1);
        const leftStream = new THREE.Mesh(leftStreamGeo, sandStreamMat);
        leftStream.position.set(-0.75, -8.5, isl.r * 0.89);
        pantai.add(leftStream);

        const rightStreamGeo = new THREE.PlaneGeometry(0.45, 16, 1, 1);
        const rightStream = new THREE.Mesh(rightStreamGeo, sandStreamMat);
        rightStream.position.set(0.72, -7.5, isl.r * 0.89);
        pantai.add(rightStream);

        // C. Tumbling 3D Low-Poly Sand Grains (Butiran Pasir Jatuh Fisik Bergaya Game)
        const sandGrainMat1 = new THREE.MeshStandardMaterial({
          color: c('#f1d69d'),
          roughness: 0.9,
          flatShading: true
        });
        const sandGrainMat2 = new THREE.MeshStandardMaterial({
          color: c('#e4bd7b'),
          roughness: 0.9,
          flatShading: true
        });

        for (let i = 0; i < 28; i++) {
          const grainMesh = new THREE.Mesh(geoLib.ico, i % 2 === 0 ? sandGrainMat1 : sandGrainMat2);
          const streamIdx = i % 3; // 3 trickling paths (left, center, right)
          const xOffset = (streamIdx - 1) * 0.72 + (Math.random() - 0.5) * 0.35;
          const zOffset = isl.r * 0.91 + (Math.random() - 0.5) * 0.25;
          grainMesh.userData = {
            baseX: xOffset,
            baseZ: zOffset,
            speed: 0.45 + Math.random() * 0.4,
            t: Math.random(),
            swaySpeed: 1.8 + Math.random() * 2.2,
            swayAmp: 0.12 + Math.random() * 0.14,
            scale: 0.22 + Math.random() * 0.2,
            rotSpeed: (Math.random() - 0.5) * 4.0
          };
          grainMesh.scale.setScalar(grainMesh.userData.scale);
          grainMesh.castShadow = true;
          pantai.add(grainMesh);
          sandfallGrains.push(grainMesh);
        }

        // 7. ANIMATED PARANGTRITIS BEACH KITES (Layang-layang Pesisir Pantai Selatan Melayang Bebas)
        const kiteColors = ['#ff4b1f', '#2563eb', '#f59e0b', '#10b981'];
        for (let k = 0; k < 4; k++) {
          const kiteGroup = new THREE.Group();
          const kiteShape = new THREE.Shape();
          kiteShape.moveTo(0, 1.3);
          kiteShape.lineTo(0.95, 0.2);
          kiteShape.lineTo(0, -1.3);
          kiteShape.lineTo(-0.95, 0.2);
          kiteShape.closePath();

          const kiteGeo = new THREE.ShapeGeometry(kiteShape);
          const kiteMat = new THREE.MeshStandardMaterial({
            color: c(kiteColors[k]),
            roughness: 0.45,
            side: THREE.DoubleSide
          });
          const kiteMesh = new THREE.Mesh(kiteGeo, kiteMat);
          kiteGroup.add(kiteMesh);

          // Flowing kite tail ribbon
          const tailGeo = new THREE.PlaneGeometry(0.2, 3.4, 1, 4);
          const tailMat = new THREE.MeshStandardMaterial({
            color: c('#ffffff'),
            side: THREE.DoubleSide,
            roughness: 0.6
          });
          const tailMesh = new THREE.Mesh(tailGeo, tailMat);
          tailMesh.position.set(0, -2.7, 0);
          kiteGroup.add(tailMesh);

          // Thin kite tether line
          const linePoints = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -14 - k * 3, 5 + k * 2)
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lineMat = new THREE.LineBasicMaterial({ color: c('#ffffff'), transparent: true, opacity: 0.35 });
          const stringLine = new THREE.Line(lineGeo, lineMat);
          kiteGroup.add(stringLine);

          const kAngle = (k / 4) * Math.PI * 1.5 + 0.35;
          const kDist = 6.5 + k * 2.2;
          const kBaseX = Math.cos(kAngle) * kDist;
          const kBaseZ = Math.sin(kAngle) * kDist;
          const kBaseY = isl.top + 16 + k * 4.5;

          kiteGroup.position.set(kBaseX, kBaseY, kBaseZ);
          kiteGroup.userData = {
            baseX: kBaseX,
            baseY: kBaseY,
            baseZ: kBaseZ,
            freq: 1.6 + k * 0.4,
            swayAmp: 0.25 + k * 0.08,
            phase: k * 1.5
          };
          g.add(kiteGroup);
          parangtritisKites.push(kiteGroup);
        }

        // 8. RISING DESERT WIND DUST PARTICLES (Partikel Debu Pasir Melayang Naik Tertiap Angin)
        for (let d = 0; d < 18; d++) {
          const dustMat = new THREE.SpriteMaterial({
            map: cloudTex,
            color: c('#ffd89a'),
            transparent: true,
            opacity: 0.45,
            depthWrite: false
          });
          const dustSp = new THREE.Sprite(dustMat);
          const dAngle = Math.random() * Math.PI * 2;
          const dDist = Math.random() * (isl.r * 0.72);
          const dBaseX = Math.cos(dAngle) * dDist;
          const dBaseZ = Math.sin(dAngle) * dDist;
          dustSp.userData = {
            baseX: dBaseX,
            baseZ: dBaseZ,
            baseY: isl.top + 1.2,
            t: Math.random(),
            speed: 0.14 + Math.random() * 0.18,
            windX: 1.8 + Math.random() * 1.4,
            riseMax: 15 + Math.random() * 12
          };
          dustSp.position.set(dBaseX, isl.top + 1.2, dBaseZ);
          dustSp.scale.setScalar(0.7);
          g.add(dustSp);
          windDustParticles.push(dustSp);
        }

        // Warm Golden Sand Dust Aura & Sunset Beach Glow
        makeGlow(pantai, 0, -2, isl.r * 0.9, 5.0, '#ffd89a');
        makeGlow(pantai, 0, -14, isl.r * 0.95, 8.0, '#eabb76');
        makeGlow(pantai, 0, 2.0, 0, 16.0, '#ff8c42');
        g.add(pantai);
      }

      scene.add(g);
    });

    // --- Chimney Smoke Particles ---
    if (studioSmokeEmitter) {
      for (let i = 0; i < 8; i++) {
        const spMat = new THREE.SpriteMaterial({
          map: cloudTex,
          color: c('#ffffff'),
          transparent: true,
          opacity: 0.0,
          depthWrite: false
        });
        const sp = new THREE.Sprite(spMat);
        sp.userData.t = i / 8;
        scene.add(sp);
        smokeSprites.push(sp);
      }
    }

    // --- SISTEM AWAN KARTUN FUN & PLAYFUL (2D Fluffy Sprites, Cozy Nintendo Aesthetic, Zero Screen Clutter) ---
    const createCartoonCloudTex = (style = 0) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 256, 128);

      const drawPuffs = (puffs, color) => {
        ctx.fillStyle = color;
        puffs.forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      };

      if (style === 0) {
        // Classic Chubby Fluffy 5-Puff Cloud (☁️)
        const base = [
          [128, 72, 40],
          [88, 80, 30],
          [54, 90, 22],
          [168, 78, 32],
          [202, 90, 20]
        ];
        // Soft pastel lavender underside shadow
        drawPuffs(base.map(([x, y, r]) => [x, y + 4, r]), 'rgba(216, 222, 245, 0.9)');
        ctx.fillStyle = 'rgba(216, 222, 245, 0.9)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(50, 84, 156, 26, 13);
        else ctx.rect(50, 84, 156, 26);
        ctx.fill();

        // Main puffy body (bright white)
        drawPuffs(base, 'rgba(255, 255, 255, 1.0)');
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(50, 80, 156, 26, 13);
        else ctx.rect(50, 80, 156, 26);
        ctx.fill();

        // Soft upper highlight for cartoon dimension
        drawPuffs([[124, 62, 26], [86, 72, 18], [164, 70, 20]], 'rgba(255, 255, 255, 0.7)');
      } else if (style === 1) {
        // Whimsical Wide Fluffy Cloud
        const base = [
          [110, 78, 32],
          [150, 75, 34],
          [72, 85, 24],
          [190, 84, 25],
          [42, 92, 16],
          [220, 92, 16]
        ];
        drawPuffs(base.map(([x, y, r]) => [x, y + 3, r]), 'rgba(218, 225, 248, 0.85)');
        ctx.fillStyle = 'rgba(218, 225, 248, 0.85)';
        ctx.fillRect(42, 86, 178, 22);

        drawPuffs(base, 'rgba(255, 255, 255, 1.0)');
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillRect(42, 82, 178, 22);

        drawPuffs([[108, 70, 22], [148, 68, 24]], 'rgba(255, 255, 255, 0.75)');
      } else {
        // Cute Chubby Cotton Puff
        const base = [
          [128, 68, 42],
          [92, 78, 30],
          [164, 78, 30]
        ];
        drawPuffs(base.map(([x, y, r]) => [x, y + 4, r]), 'rgba(215, 222, 245, 0.88)');
        drawPuffs(base, 'rgba(255, 255, 255, 1.0)');
        drawPuffs([[124, 58, 28], [90, 72, 18], [160, 72, 18]], 'rgba(255, 255, 255, 0.75)');
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.generateMipmaps = true;
      return tex;
    };

    const cartoonCloudTextures = [
      createCartoonCloudTex(0),
      createCartoonCloudTex(1),
      createCartoonCloudTex(2)
    ];

    const cartoonCloudMaterials = cartoonCloudTextures.map((tex) => {
      return new THREE.SpriteMaterial({
        map: tex,
        color: c('#ffffff'),
        transparent: true,
        opacity: 0.88,
        depthWrite: false
      });
    });

    // Helper to spawn a fun cartoon cloud sprite
    const spawnFunCloud = (x, y, z, baseW, baseH, opacity = 0.85, driftX = 0.45, driftZ = 0.08) => {
      const matIdx = Math.floor(Math.random() * cartoonCloudMaterials.length);
      const sprite = new THREE.Sprite(cartoonCloudMaterials[matIdx]);
      sprite.position.set(x, y, z);
      sprite.scale.set(baseW, baseH, 1);
      sprite.userData = {
        baseY: y,
        baseW,
        baseH,
        driftX,
        driftZ,
        bobAmp: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        opacity
      };
      scene.add(sprite);
      cloudChunks.push(sprite);
      return sprite;
    };

    // 1. Dreamy Under-Sea Clouds (Lautan Awan Bawah - di bawah pulau, y = -22 s/d -36)
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 35 + Math.random() * 280;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist - 20;
      const y = -22 - Math.random() * 14;
      const w = 40 + Math.random() * 32;
      const h = w * 0.5;
      spawnFunCloud(x, y, z, w, h, 0.82, 0.5 + Math.random() * 0.2, 0.08 + Math.random() * 0.06);
    }

    // 2. Whimsical High Sky Clouds (Awan Langit Kartun di Atas, y = 55 s/d 90)
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 40 + Math.random() * 300;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist - 30;
      const y = 55 + Math.random() * 35;
      const w = 50 + Math.random() * 40;
      const h = w * 0.5;
      spawnFunCloud(x, y, z, w, h, 0.78, 0.25 + Math.random() * 0.12, 0.04 + Math.random() * 0.04);
    }

    // 3. Distant Horizon Clouds (Awan Cakrawala Jauh, r = 220 s/d 380, y = 6 s/d 28)
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dist = 220 + Math.random() * 160;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist - 25;
      const y = 6 + Math.random() * 22;
      const w = 45 + Math.random() * 35;
      const h = w * 0.5;
      spawnFunCloud(x, y, z, w, h, 0.72, 0.18 + Math.random() * 0.08, 0.03 + Math.random() * 0.03);
    }

    // 4. Occasional Tiny Fun Puffs (Awan Mini Ceria - kecil & transparan, tidak mengganggu)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 85 + Math.random() * 70; // Di sela-sela antar pulau, bukan di tengah start
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist - 20;
      const y = 14 + Math.random() * 8;
      const w = 9 + Math.random() * 5;
      const h = w * 0.5;
      spawnFunCloud(x, y, z, w, h, 0.52, 0.35 + Math.random() * 0.1, 0.05 + Math.random() * 0.03);
    }

    // --- Flock of Animated Birds ---
    const birdGeo = new THREE.BufferGeometry();
    birdGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0.35, -1, 0.1, -0.1, 0, 0, -0.25, 0, 0, 0.35, 0, 0, -0.25, 1, 0.1, -0.1], 3)
    );
    birdGeo.computeVertexNormals();
    const birdMat = new THREE.MeshStandardMaterial({ color: c('#2b2e3d'), side: THREE.DoubleSide, roughness: 1.0 });
    const birdFlocks = [];

    for (let f = 0; f < 3; f++) {
      const fcx = (Math.random() - 0.5) * 160;
      const fcz = -40 - Math.random() * 80;
      for (let b = 0; b < 5; b++) {
        const birdMesh = new THREE.Mesh(birdGeo, birdMat);
        birdMesh.scale.setScalar(0.9 + Math.random() * 0.4);
        scene.add(birdMesh);
        birdFlocks.push({
          m: birdMesh,
          cx: fcx + (Math.random() - 0.5) * 12,
          cz: fcz + (Math.random() - 0.5) * 12,
          r: 18 + Math.random() * 16,
          y: 26 + Math.random() * 10,
          sp: (0.18 + Math.random() * 0.1) * (f % 2 === 0 ? 1 : -1),
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    // --- The Airship (Zeppelin) - EXACT ORANGE ENVELOPE ---
    const airship = new THREE.Group();
    const shipHull = new THREE.Group();
    airship.add(shipHull);

    // Envelope with orange #FF4B1F flat-shaded facet geometry
    const envelopeMat = new THREE.MeshStandardMaterial({
      color: c('#FF4B1F'),
      roughness: 0.55,
      metalness: 0.05,
      flatShading: true
    });
    const envelope = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), envelopeMat);
    envelope.scale.set(2.3, 2.3, 6.2);
    envelope.castShadow = true;
    shipHull.add(envelope);

    // Gold rings around envelope
    const goldRing1 = new THREE.Mesh(new THREE.CylinderGeometry(2.33, 2.33, 0.28, 40, 1, true), matLib.gold);
    goldRing1.rotation.x = Math.PI / 2;
    goldRing1.position.z = -1.6;
    goldRing1.material.side = THREE.DoubleSide;
    shipHull.add(goldRing1);

    const goldRing2 = goldRing1.clone();
    goldRing2.position.z = -2.3;
    goldRing2.scale.set(0.97, 0.4, 0.97);
    shipHull.add(goldRing2);

    // Gold nose dome
    const noseCap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), matLib.gold);
    noseCap.position.z = -6.05;
    shipHull.add(noseCap);

    // 4 White tail fins
    const finMat = new THREE.MeshStandardMaterial({ color: c('#f4efe6'), roughness: 0.6 });
    for (let f = 0; f < 4; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.1), finMat);
      fin.castShadow = true;
      const fa = (f / 4) * Math.PI * 2;
      fin.position.set(Math.cos(fa) * 1.45, Math.sin(fa) * 1.45, 5.1);
      fin.rotation.z = fa - Math.PI / 2;
      shipHull.add(fin);
    }

    // Gondola
    const gondola = new THREE.Group();
    gondola.position.set(0, -3.05, -0.4);
    gondola.add(makeMesh(geoLib.box, matLib.wood, 1.6, 1.15, 3.6, 0, 0, 0));
    gondola.add(makeMesh(geoLib.box, matLib.window, 1.64, 0.42, 2.6, 0, 0.12, -0.1));
    gondola.add(makeMesh(geoLib.box, matLib.woodDark, 1.7, 0.16, 3.7, 0, -0.62, 0));

    const strutPositions = [[-0.6, -1.4], [0.6, -1.4], [-0.6, 1.4], [0.6, 1.4]];
    strutPositions.forEach(([sx, sz]) => {
      const strut = makeMesh(geoLib.cyl6, matLib.metal, 0.04, 1.6, 0.04, sx, 1.25, sz);
      strut.rotation.z = sx > 0 ? -0.2 : 0.2;
      gondola.add(strut);
    });

    // Dark Propeller Blades
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0.1, 2.0);
    propGroup.add(makeMesh(geoLib.cyl12, matLib.metal, 0.16, 0.5, 0.16, 0, 0, 0).rotateX(Math.PI / 2));
    for (let p = 0; p < 3; p++) {
      const blade = makeMesh(geoLib.box, matLib.woodDark, 0.16, 1.8, 0.06, 0, 0, 0.2);
      blade.rotation.z = (p / 3) * Math.PI * 2;
      blade.position.set(Math.sin(blade.rotation.z) * 0.55, Math.cos(blade.rotation.z) * 0.55, 0.2);
      propGroup.add(blade);
    }
    gondola.add(propGroup);

    makeGlow(gondola, 0, 0.12, -1.9, 2.5, '#ffd08a');
    airship.add(gondola);

    // Forward Searchlight Beam
    const searchlight = new THREE.SpotLight(0xfffae0, 2.8, 90, Math.PI / 6, 0.4, 1.2);
    searchlight.position.set(0, -3.05, -2.2);
    searchlight.target.position.set(0, -10.0, -45.0);
    airship.add(searchlight);
    airship.add(searchlight.target);

    airship.scale.setScalar(1.15);
    scene.add(airship);

    // Mooring Ring
    const mooringRing = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.5, 40),
      new THREE.MeshBasicMaterial({
        color: c('#FF4B1F'),
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    mooringRing.rotation.x = -Math.PI / 2;
    scene.add(mooringRing);

    // -------------------------------------------------------------------------
    // World Boundary Configuration & 3D Celestial Barrier ("ada pembatas nya")
    // -------------------------------------------------------------------------
    const BOUNDARY_CENTER_X = 0;
    const BOUNDARY_CENTER_Z = -75;
    const BOUNDARY_RADIUS = 175;
    const BOUNDARY_WARNING_DIST = 24;

    const boundaryGroup = new THREE.Group();
    boundaryGroup.position.set(BOUNDARY_CENTER_X, 16.0, BOUNDARY_CENTER_Z);

    // Glowing Torus Wind Stream Ring
    const boundaryRingGeo = new THREE.TorusGeometry(BOUNDARY_RADIUS, 0.45, 8, 96);
    const boundaryRingMat = new THREE.MeshBasicMaterial({
      color: c('#FF8A3D'),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const boundaryRing = new THREE.Mesh(boundaryRingGeo, boundaryRingMat);
    boundaryRing.rotation.x = Math.PI / 2;
    boundaryGroup.add(boundaryRing);

    // Secondary Inner Rune Orbit
    const boundaryInnerGeo = new THREE.TorusGeometry(BOUNDARY_RADIUS - 1.2, 0.22, 6, 80);
    const boundaryInnerMat = new THREE.MeshBasicMaterial({
      color: c('#ffd08a'),
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const boundaryInnerRing = new THREE.Mesh(boundaryInnerGeo, boundaryInnerMat);
    boundaryInnerRing.rotation.x = Math.PI / 2;
    boundaryGroup.add(boundaryInnerRing);

    // Stylized perimeter boundary clouds
    const boundaryCloudPuffs = [];
    const bCloudGeo = new THREE.DodecahedronGeometry(5.2, 1);
    const bCloudMat = new THREE.MeshStandardMaterial({
      color: c('#ffffff'),
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });
    const numBoundaryClouds = 28;
    for (let bi = 0; bi < numBoundaryClouds; bi++) {
      const bAngle = (bi / numBoundaryClouds) * Math.PI * 2;
      const puff = new THREE.Group();
      puff.position.set(
        Math.cos(bAngle) * BOUNDARY_RADIUS,
        Math.sin(bi * 1.5) * 2.5 - 2.0,
        Math.sin(bAngle) * BOUNDARY_RADIUS
      );
      const m1 = new THREE.Mesh(bCloudGeo, bCloudMat);
      m1.scale.set(1.4, 0.85, 1.2);
      puff.add(m1);
      const m2 = new THREE.Mesh(bCloudGeo, bCloudMat);
      m2.scale.set(0.95, 0.7, 0.95);
      m2.position.set(2.2, 0.8, -1.0);
      puff.add(m2);
      const m3 = new THREE.Mesh(bCloudGeo, bCloudMat);
      m3.scale.set(1.1, 0.75, 1.0);
      m3.position.set(-2.0, 0.4, 1.2);
      puff.add(m3);

      puff.userData = { phase: bi * 0.45 };
      boundaryGroup.add(puff);
      boundaryCloudPuffs.push(puff);
    }
    scene.add(boundaryGroup);

    // -------------------------------------------------------------------------
    // Architectural & Landmass Colliders ("gak bisa tembusin bangunan")
    // -------------------------------------------------------------------------
    const buildingColliders = [
      // 1. Candi Prambanan (Candi Siwa Shikhara 47m, Brahma, Wisnu, Wahana)
      { id: 'prambanan_siwa', x: 66, z: -22, r: 6.5, topY: 33.0, bottomY: 10.0, name: 'Candi Siwa' },
      { id: 'prambanan_brahma', x: 60.5, z: -23.5, r: 4.5, topY: 26.5, bottomY: 10.0, name: 'Candi Brahma' },
      { id: 'prambanan_wisnu', x: 71.5, z: -23.5, r: 4.5, topY: 26.5, bottomY: 10.0, name: 'Candi Wisnu' },
      { id: 'prambanan_wahana', x: 66, z: -15, r: 4.2, topY: 21.5, bottomY: 10.0, name: 'Candi Nandi' },

      // 2. Keraton Yogyakarta (Pendopo Ageng Bangsal Kencana & Regol)
      { id: 'keraton_joglo', x: -59, z: -11, r: 7.2, topY: 22.5, bottomY: 10.0, name: 'Pendopo Ageng Joglo' },
      { id: 'keraton_regol', x: -59, z: -5.8, r: 3.8, topY: 19.5, bottomY: 10.0, name: 'Regol Donopratopo' },
      { id: 'keraton_kereta', x: -50.5, z: -9.5, r: 4.2, topY: 18.0, bottomY: 10.0, name: 'Bangsal Kereta' },

      // 3. Candi Ratu Boko (Gerbang Paduraksa Kembar)
      { id: 'ratuboko_gate', x: 95, z: -90, r: 6.8, topY: 23.5, bottomY: 10.0, name: 'Gerbang Paduraksa' },
      { id: 'ratuboko_candi', x: 99, z: -84, r: 4.6, topY: 18.5, bottomY: 10.0, name: 'Candi Pembakaran' },

      // 4. Istana Air Tamansari (Menara Said & Sumur Gumuling)
      { id: 'tamansari_tower', x: -24, z: -78, r: 4.8, topY: 25.5, bottomY: 10.0, name: 'Menara Said' },
      { id: 'tamansari_sumur', x: -28, z: -73, r: 5.6, topY: 19.5, bottomY: 10.0, name: 'Sumur Gumuling' },

      // 5. Tebing Breksi & Mangunan (Tebing Kapur Vulkanik Berukir)
      { id: 'breksi_cliff', x: 0, z: -160, r: 10.2, topY: 27.5, bottomY: 10.0, name: 'Tebing Breksi' },
      { id: 'breksi_mangunan', x: -6, z: -164, r: 5.4, topY: 22.5, bottomY: 10.0, name: 'Gardu Mangunan' },

      // 6. Gumuk Pasir Parangtritis (Puncak Gumuk Pasir Barchan & Pura Cepuri)
      { id: 'gumuk_dune', x: -85, z: -120, r: 8.0, topY: 22.0, bottomY: 10.0, name: 'Puncak Gumuk Pasir' },
      { id: 'gumuk_pura', x: -81, z: -125, r: 4.6, topY: 18.5, bottomY: 10.0, name: 'Pura Cepuri' },

      // 7. Titik Nol & Tugu Jogja (Monumen Tugu Pal Putih & Gedung Sejarah BNI)
      { id: 'tugu_spire', x: 34, z: -100, r: 3.6, topY: 30.0, bottomY: 10.0, name: 'Tugu Pal Putih' },
      { id: 'tugu_colonial', x: 32, z: -94, r: 5.4, topY: 19.5, bottomY: 10.0, name: 'Gedung BNI Sejarah' },

      // 8. Kampung & Warung Apung Warga (8 Islets)
      { id: 'islet_0', x: -110, z: 30, r: 4.5, topY: 14.5, bottomY: 6.0, name: 'Rumah Limasan Kampung' },
      { id: 'islet_1', x: -95, z: -60, r: 4.0, topY: 15.0, bottomY: 6.0, name: 'Warung Kopi Klotok' },
      { id: 'islet_2', x: 10, z: -50, r: 3.6, topY: 13.5, bottomY: 6.0, name: 'Pos Ronda Warga' },
      { id: 'islet_3', x: -40, z: 50, r: 4.2, topY: 15.0, bottomY: 6.0, name: 'Warung Kelontong Madura' },
      { id: 'islet_4', x: 110, z: 25, r: 4.5, topY: 14.5, bottomY: 6.0, name: 'Rumah Gedek Bambu' },
      { id: 'islet_5', x: 98, z: -80, r: 3.8, topY: 13.5, bottomY: 6.0, name: 'Warung Es Kelapa Muda' },
      { id: 'islet_6', x: -65, z: -135, r: 5.0, topY: 15.5, bottomY: 6.0, name: 'Bengkel Tambal Ban' },
      { id: 'islet_7', x: 70, z: -150, r: 4.5, topY: 14.5, bottomY: 6.0, name: 'Gubuk Sawah Panggung' }
    ];

    let lastBumpTime = 0;

    // Physics State
    const ship = {
      x: 0,
      y: 17.4,
      targetAltitude: 17.4,
      z: 62,
      yaw: 0,
      speed: 0,
      yawRate: 0,
      roll: 0,
      pitch: 0,
      throttle: 0,
      docked: null,
      autopilotTarget: null
    };

    airship.position.set(ship.x, ship.y, ship.z);

    const camState = {
      dist: 36,
      targetDist: 36,
      yawOff: 0.04,
      targetYawOff: 0.04,
      pitch: 0.24,
      targetPitch: 0.24,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      camBumpShake: 0
    };

    // Keyboard controls state
    const keys = {
      w: false,
      s: false,
      a: false,
      d: false,
      up: false,
      down: false,
      shift: false
    };

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();

      // Prevent browser from scrolling the window with game keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(k)) {
        e.preventDefault();
      }

      // Any manual key press instantly takes manual control and cancels autopilot
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'e', 'c', 'q'].includes(k)) {
        ship.autopilotTarget = null;
        if (ship.docked) undock();
      }

      if (k === 'w' || k === 'arrowup') keys.w = true;
      if (k === 's' || k === 'arrowdown') keys.s = true;
      if (k === 'a' || k === 'arrowleft') keys.a = true;
      if (k === 'd' || k === 'arrowright') keys.d = true;
      if (e.key === ' ' || k === 'e') {
        e.preventDefault();
        keys.up = true;
      }
      if (k === 'c' || k === 'q') keys.down = true;
      if (e.key === 'Shift') keys.shift = true;

      if (e.key === 'Enter') {
        if (nearestIslandRef.current && !ship.docked) {
          dockAtIsland(nearestIslandRef.current.id);
        }
      }

      if (e.key === 'Escape') {
        if (ship.docked) undock();
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') keys.w = false;
      if (k === 's' || k === 'arrowdown') keys.s = false;
      if (k === 'a' || k === 'arrowleft') keys.a = false;
      if (k === 'd' || k === 'arrowright') keys.d = false;
      if (e.key === ' ' || k === 'e') keys.up = false;
      if (k === 'c' || k === 'q') keys.down = false;
      if (e.key === 'Shift') keys.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    // Mouse Dragging to orbit camera with drag vs click discrimination
    let pointerStartX = 0;
    let pointerStartY = 0;
    let hasDragged = false;

    const handlePointerDown = (e) => {
      if (e.target.closest('.sa-pill') || e.target.closest('button')) return;
      camState.isDragging = true;
      camState.lastMouseX = e.clientX;
      camState.lastMouseY = e.clientY;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      hasDragged = false;
    };

    const handlePointerMove = (e) => {
      if (!camState.isDragging) return;
      const dx = e.clientX - camState.lastMouseX;
      const dy = e.clientY - camState.lastMouseY;
      
      // If moved more than 5px, it's a camera drag, NOT a click
      if (Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY) > 5) {
        hasDragged = true;
      }

      camState.lastMouseX = e.clientX;
      camState.lastMouseY = e.clientY;

      camState.targetYawOff -= dx * 0.004;
      camState.targetPitch = Math.max(0.08, Math.min(0.65, camState.targetPitch + dy * 0.003));
    };

    const handlePointerUp = () => {
      camState.isDragging = false;
    };

    const handleWheel = (e) => {
      camState.targetDist = Math.max(16, Math.min(75, camState.targetDist + e.deltaY * 0.035));
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: true });

    // Focus container on mount so keyboard works immediately without clicking
    container.tabIndex = 0;
    container.style.outline = 'none';
    container.focus();

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    const flightPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -17.4);

    const handleClick = (e) => {
      // If user was dragging to orbit camera, ignore click
      if (hasDragged) {
        hasDragged = false;
        return;
      }
      if (e.target.closest('.sa-pill') || e.target.closest('button')) return;

      const rect = container.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const targetPt = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(flightPlane, targetPt)) {
        if (ship.docked) undock();
        ship.autopilotTarget = targetPt;
      }
    };
    container.addEventListener('click', handleClick);

    const nearestIslandRef = { current: null };

    const dockAtIsland = (islandId) => {
      const isl = islandsList.find((i) => i.id === islandId);
      if (!isl) return;
      ship.docked = islandId;
      ship.autopilotTarget = null;
      soundEngine.playChime();
      if (onDockRef.current) onDockRef.current(islandId);
    };

    const undock = () => {
      if (!ship.docked) return;
      ship.docked = null;
      ship.speed = 0.4;
      if (onUndockRef.current) onUndockRef.current();
    };

    sceneRef.current.flyTo = (islandId) => {
      const isl = islandsList.find((i) => i.id === islandId);
      if (!isl) return;
      if (ship.docked) undock();
      ship.autopilotTarget = isl.dockPos.clone();
    };

    let animId = null;
    let lastTime = performance.now();
    let startTime = performance.now();
    let nightLerp = isNight ? 1 : 0;
    let camSmoothYaw = ship.yaw;
    const camSmoothLook = new THREE.Vector3(ship.x, ship.y + 1.2, ship.z);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const time = (now - startTime) / 1000;

      const targetNight = isNightRef.current ? 1 : 0;
      nightLerp += (targetNight - nightLerp) * (1 - Math.exp(-3 * delta));

      skyUniforms.uTime.value = time;
      skyUniforms.uStars.value = nightLerp;
      skyUniforms.uZenith.value.lerpColors(dayTheme.zenith, nightTheme.zenith, nightLerp);
      skyUniforms.uHorizon.value.lerpColors(dayTheme.horizon, nightTheme.horizon, nightLerp);
      skyUniforms.uSun.value.lerpColors(dayTheme.sun, nightTheme.sun, nightLerp);

      cloudUniforms.uLit.value.lerpColors(dayTheme.cloudLit, nightTheme.cloudLit, nightLerp);
      cloudUniforms.uShade.value.lerpColors(dayTheme.cloudShade, nightTheme.cloudShade, nightLerp);
      cloudUniforms.uFog.value.lerpColors(dayTheme.fog, nightTheme.fog, nightLerp);
      scene.fog.color.lerpColors(dayTheme.fog, nightTheme.fog, nightLerp);

      hemiLight.color.lerpColors(dayTheme.hemiSky, nightTheme.hemiSky, nightLerp);
      hemiLight.groundColor.lerpColors(dayTheme.hemiGround, nightTheme.hemiGround, nightLerp);
      hemiLight.intensity = dayTheme.hemiI + (nightTheme.hemiI - dayTheme.hemiI) * nightLerp;
      sunLight.color.lerpColors(dayTheme.sun, nightTheme.sun, nightLerp);
      sunLight.intensity = dayTheme.sunI + (nightTheme.sunI - dayTheme.sunI) * nightLerp;
      renderer.toneMappingExposure = dayTheme.exposure + (nightTheme.exposure - dayTheme.exposure) * nightLerp;

      // Fun Cartoon Clouds Night Transition (Shifts smoothly to cozy lavender-indigo night tint)
      const cloudDayCol = c('#ffffff');
      const cloudNightCol = c('#756d96');
      cartoonCloudMaterials.forEach((mat) => {
        mat.color.lerpColors(cloudDayCol, cloudNightCol, nightLerp);
        mat.opacity = 0.88 - nightLerp * 0.15;
      });

      // Windows and lamps glow intensely at night
      if (matLib.window) matLib.window.emissiveIntensity = 0.08 + nightLerp * 3.5;
      if (matLib.lamp) matLib.lamp.emissiveIntensity = 0.2 + nightLerp * 4.0;

      // Update Fun Cartoon Clouds (Playful drift, cute bobbing, and cartoon squash & stretch breathing)
      cloudChunks.forEach((sp) => {
        sp.position.x += sp.userData.driftX * delta * 12.0;
        sp.position.z += sp.userData.driftZ * delta * 12.0;
        sp.position.y = sp.userData.baseY + Math.sin(time * 0.75 + sp.userData.phase) * sp.userData.bobAmp;

        // Playful cartoon breathing squash & stretch
        const breath = 1.0 + Math.sin(time * 1.2 + sp.userData.phase) * 0.04;
        sp.scale.x = sp.userData.baseW * breath;
        sp.scale.y = sp.userData.baseH * (1.0 / breath);

        // Seamless infinite wrap-around at world boundary
        if (sp.position.x > 380) sp.position.x = -380;
        if (sp.position.x < -380) sp.position.x = 380;
        if (sp.position.z > 380) sp.position.z = -380;
        if (sp.position.z < -380) sp.position.z = 380;
      });

      // Update Flapping Birds
      birdFlocks.forEach((b) => {
        const t = b.ph + time * b.sp;
        b.m.position.set(b.cx + Math.cos(t) * b.r, b.y + Math.sin(time * 0.6 + b.ph) * 1.5, b.cz + Math.sin(t) * b.r);
        b.m.rotation.set(0, -t + (b.sp > 0 ? 0 : Math.PI), Math.sin(time * 9.0 + b.ph) * 0.5);
        b.m.scale.y = 0.6 + Math.abs(Math.sin(time * 9.0 + b.ph)) * 0.6;
      });

      // Update Studio Chimney Smoke
      if (studioSmokeEmitter) {
        smokeSprites.forEach((sp) => {
          sp.userData.t = (sp.userData.t + delta * 0.12) % 1.0;
          const r = sp.userData.t;
          sp.position.set(studioSmokeEmitter.x + r * 3.0, studioSmokeEmitter.y + r * 7.0, studioSmokeEmitter.z - r * 1.5);
          sp.scale.setScalar(1.0 + r * 4.0);
          sp.material.opacity = (1.0 - r) * 0.35 * (1.0 - nightLerp * 0.5);
        });
      }

      // Update Stylized Game Sandfall Grains on Gumuk Pasir (Butiran Pasir Jatuh Bergaya Game)
      sandfallGrains.forEach((grain) => {
        grain.userData.t = (grain.userData.t + delta * grain.userData.speed) % 1.0;
        const progress = grain.userData.t;
        const fallDist = Math.pow(progress, 1.25) * 25.0;
        const sway = Math.sin(time * grain.userData.swaySpeed + grain.userData.baseX * 6.0) * grain.userData.swayAmp;

        grain.position.set(
          grain.userData.baseX + sway,
          0.2 - fallDist,
          grain.userData.baseZ + progress * 0.35
        );
        grain.rotation.x += grain.userData.rotSpeed * delta;
        grain.rotation.y += grain.userData.rotSpeed * delta;

        // Shrink gently as it disperses into cloud mist at bottom
        const sz = grain.userData.scale * (progress < 0.08 ? progress * 12.5 : (1.0 - progress * 0.6));
        grain.scale.setScalar(Math.max(0.04, sz));
      });

      // Update Animated Parangtritis Beach Kites (Layang-layang Berayun Tertiap Angin Laut)
      parangtritisKites.forEach((kite) => {
        kite.rotation.z = Math.sin(time * kite.userData.freq) * kite.userData.swayAmp;
        kite.rotation.x = Math.sin(time * 0.8 + kite.userData.phase) * 0.18 + 0.28;
        kite.rotation.y = Math.sin(time * 0.5 + kite.userData.phase) * 0.15;
        kite.position.y = kite.userData.baseY + Math.sin(time * 0.9 + kite.userData.phase) * 1.3;
        kite.position.x = kite.userData.baseX + Math.cos(time * 0.6 + kite.userData.phase) * 0.8;
      });

      // Update Rising Wind Dust on Gumuk Pasir
      windDustParticles.forEach((p) => {
        p.userData.t = (p.userData.t + delta * p.userData.speed) % 1.0;
        const pt = p.userData.t;
        p.position.y = p.userData.baseY + pt * p.userData.riseMax;
        p.position.x = p.userData.baseX + pt * p.userData.windX + Math.sin(time * 2.2 + p.userData.baseX) * 0.5;
        p.position.z = p.userData.baseZ + Math.cos(time * 1.7 + p.userData.baseZ) * 0.4;
        p.material.opacity = (1.0 - pt) * 0.45;
        p.scale.setScalar(0.4 + pt * 0.8);
      });

      glowingSprites.forEach((sp) => {
        sp.material.opacity = nightLerp * 0.9;
        sp.visible = nightLerp > 0.01;
      });

      // Rotating Beacon Beams & Pulse on Signal Tower (as in screenshot)
      const signalIsland = islandsList.find((i) => i.id === 'contact');
      if (signalIsland) {
        if (signalIsland.beaconBeams) {
          signalIsland.beaconBeams.rotation.y += delta * 0.65;
          signalIsland.beaconBeams.visible = nightLerp > 0.01;
        }
        if (signalIsland.beaconBeamMat) {
          signalIsland.beaconBeamMat.opacity = nightLerp * 0.25;
        }
        if (signalIsland.beaconGlow) {
          const pulse = Math.sin(time * 4.0) * 0.5 + 0.5;
          signalIsland.beaconGlow.scale.setScalar(6.0 + pulse * 4.0);
        }
        if (signalIsland.beaconMesh) {
          const pulse = Math.sin(time * 4.0) * 0.5 + 0.5;
          signalIsland.beaconMesh.material.emissiveIntensity = 1.0 + pulse * 3.0;
        }
      }

      // Flight Physics Simulation
      if (ship.docked) {
        const dockedIsl = islandsList.find((i) => i.id === ship.docked);
        if (dockedIsl) {
          const targetPos = dockedIsl.dockPos;
          const targetYaw = dockedIsl.dockAngle + Math.PI / 2;

          ship.x += (targetPos.x - ship.x) * (1 - Math.exp(-4 * delta));
          ship.z += (targetPos.z - ship.z) * (1 - Math.exp(-4 * delta));
          ship.y = targetPos.y + Math.sin(time * 1.5) * 0.35;

          let dyaw = targetYaw - ship.yaw;
          while (dyaw > Math.PI) dyaw -= Math.PI * 2;
          while (dyaw < -Math.PI) dyaw += Math.PI * 2;
          ship.yaw += dyaw * (1 - Math.exp(-3 * delta));

          ship.speed *= 0.9;
          ship.roll *= 0.85;
          ship.pitch = Math.sin(time * 1.2) * 0.03;
          ship.throttle = 0;
        }
      } else if (ship.autopilotTarget) {
        const dx = ship.autopilotTarget.x - ship.x;
        const dz = ship.autopilotTarget.z - ship.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 4.5) {
          let dockedNow = false;
          for (let isl of islandsList) {
            if (isl.dockPos && ship.autopilotTarget.distanceTo(isl.dockPos) < 6.0) {
              dockAtIsland(isl.id);
              dockedNow = true;
              break;
            }
          }
          if (!dockedNow) ship.autopilotTarget = null;
        } else {
          const desiredYaw = Math.atan2(dx, -dz);
          let dyaw = desiredYaw - ship.yaw;
          while (dyaw > Math.PI) dyaw -= Math.PI * 2;
          while (dyaw < -Math.PI) dyaw += Math.PI * 2;

          ship.yawRate = Math.max(-1.8, Math.min(1.8, dyaw * 2.2));
          ship.yaw += ship.yawRate * delta;

          const maxSpd = Math.min(1.2, dist * 0.08);
          ship.speed += (maxSpd - ship.speed) * (1 - Math.exp(-2.5 * delta));
          ship.throttle = ship.speed / 1.2;
        }
      } else {
        let targetSpeed = 0;
        if (keys.w) targetSpeed = keys.shift ? 2.2 : 1.1;
        if (keys.s) targetSpeed = -0.4;

        ship.speed += (targetSpeed - ship.speed) * (1 - Math.exp(-2.5 * delta));
        ship.throttle = Math.abs(ship.speed) / (keys.shift ? 2.2 : 1.1);

        let steer = 0;
        if (keys.a) steer -= 1;
        if (keys.d) steer += 1;

        ship.yawRate += (steer * 1.4 - ship.yawRate) * (1 - Math.exp(-4 * delta));
        ship.yaw += ship.yawRate * delta;

        ship.roll += (-ship.yawRate * 0.18 - ship.roll) * (1 - Math.exp(-5 * delta));
        ship.pitch += ((targetSpeed > 0 ? 0.04 : 0) - ship.pitch) * (1 - Math.exp(-3 * delta));
      }

      let isNearBoundary = false;

      if (!ship.docked) {
        if (keys.up) {
          ship.targetAltitude = Math.min(36.0, ship.targetAltitude + 10.0 * delta);
          ship.pitch += (0.12 - ship.pitch) * (1 - Math.exp(-4 * delta));
        } else if (keys.down) {
          ship.targetAltitude = Math.max(12.0, ship.targetAltitude - 10.0 * delta);
          ship.pitch += (-0.12 - ship.pitch) * (1 - Math.exp(-4 * delta));
        } else if (!ship.autopilotTarget) {
          // Slow recovery towards standard cruising altitude
          ship.targetAltitude += (17.4 - ship.targetAltitude) * 0.08 * delta;
        }

        ship.x += Math.sin(ship.yaw) * ship.speed * 28 * delta;
        ship.z -= Math.cos(ship.yaw) * ship.speed * 28 * delta;
        ship.y += (ship.targetAltitude + Math.sin(time * 1.5) * 0.25 - ship.y) * (1 - Math.exp(-3 * delta));

        // -----------------------------------------------------------------
        // 1. FLIGHT BOUNDARY ENFORCEMENT ("ada pembatas nya")
        // -----------------------------------------------------------------
        const distFromBoundaryCenter = Math.hypot(ship.x - BOUNDARY_CENTER_X, ship.z - BOUNDARY_CENTER_Z);

        if (distFromBoundaryCenter > BOUNDARY_RADIUS) {
          isNearBoundary = true;
          // Hard clamp to perimeter ring
          const bAngle = Math.atan2(ship.z - BOUNDARY_CENTER_Z, ship.x - BOUNDARY_CENTER_X);
          ship.x = BOUNDARY_CENTER_X + Math.cos(bAngle) * BOUNDARY_RADIUS;
          ship.z = BOUNDARY_CENTER_Z + Math.sin(bAngle) * BOUNDARY_RADIUS;

          // Elastic inward redirection: steer yaw towards archipelago center
          const inwardYaw = Math.atan2(BOUNDARY_CENTER_X - ship.x, -(BOUNDARY_CENTER_Z - ship.z));
          let dyaw = inwardYaw - ship.yaw;
          while (dyaw > Math.PI) dyaw -= Math.PI * 2;
          while (dyaw < -Math.PI) dyaw += Math.PI * 2;
          ship.yaw += dyaw * (1 - Math.exp(-3.6 * delta));
          ship.speed = Math.max(0.15, ship.speed * 0.85);
        } else if (distFromBoundaryCenter > BOUNDARY_RADIUS - BOUNDARY_WARNING_DIST) {
          isNearBoundary = true;
          // Soft boundary wind current: gentle nudge towards center
          const factor = (distFromBoundaryCenter - (BOUNDARY_RADIUS - BOUNDARY_WARNING_DIST)) / BOUNDARY_WARNING_DIST;
          const inwardX = (BOUNDARY_CENTER_X - ship.x) / (distFromBoundaryCenter || 1);
          const inwardZ = (BOUNDARY_CENTER_Z - ship.z) / (distFromBoundaryCenter || 1);
          ship.x += inwardX * factor * 14.0 * delta;
          ship.z += inwardZ * factor * 14.0 * delta;

          const inwardYaw = Math.atan2(BOUNDARY_CENTER_X - ship.x, -(BOUNDARY_CENTER_Z - ship.z));
          let dyaw = inwardYaw - ship.yaw;
          while (dyaw > Math.PI) dyaw -= Math.PI * 2;
          while (dyaw < -Math.PI) dyaw += Math.PI * 2;
          ship.yaw += dyaw * factor * 1.8 * delta;
        }

        // Altitude Boundaries
        if (ship.y < 10.5) {
          ship.y = 10.5;
          if (ship.targetAltitude < 11.5) ship.targetAltitude = 11.5;
        }
        if (ship.y > 38.0) {
          ship.y = 38.0;
          if (ship.targetAltitude > 36.5) ship.targetAltitude = 36.5;
        }

        // -----------------------------------------------------------------
        // 2. SOLID BUILDING & LANDMASS COLLISION RESOLUTION ("gak bisa tembusin bangunan")
        // -----------------------------------------------------------------
        const SHIP_RADIUS = 2.4;
        let collisionOccurred = false;

        // Check if player is approaching a dock for landing
        let isNearAnyDock = false;
        for (let isl of islandsList) {
          if (isl.dockPos && Math.hypot(ship.x - isl.dockPos.x, ship.z - isl.dockPos.z) < 6.5) {
            isNearAnyDock = true;
            break;
          }
        }

        // A. Building & Structure Colliders (Specific architectural landmarks)
        for (let col of buildingColliders) {
          const colTop = col.topY;
          const colBottom = col.bottomY !== undefined ? col.bottomY : 6.0;

          // Vertical overlap check
          if (ship.y - SHIP_RADIUS < colTop && ship.y + SHIP_RADIUS > colBottom) {
            const dx = ship.x - col.x;
            const dz = ship.z - col.z;
            const distSq = dx * dx + dz * dz;
            const minDist = col.r + SHIP_RADIUS;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq) || 0.001;
              const nx = dx / dist;
              const nz = dz / dist;

              // Check if ship is touching roof from above
              const distToTop = (colTop + SHIP_RADIUS) - ship.y;
              if (distToTop < 1.4 && ship.y >= colTop - 0.5) {
                // Land / slide on roof surface
                ship.y = colTop + SHIP_RADIUS;
                if (ship.targetAltitude < colTop + SHIP_RADIUS) {
                  ship.targetAltitude = colTop + SHIP_RADIUS + 0.5;
                }
              } else {
                // Horizontal push-out
                ship.x = col.x + nx * minDist;
                ship.z = col.z + nz * minDist;

                // Deflect speed if flying towards collider
                const vX = Math.sin(ship.yaw) * ship.speed;
                const vZ = -Math.cos(ship.yaw) * ship.speed;
                const dot = vX * nx + vZ * nz;
                if (dot < 0) {
                  ship.speed = Math.max(-0.25, ship.speed * 0.2);
                  collisionOccurred = true;
                }
              }
            }
          }
        }

        // B. Island Cliff / Landmass Surface Colliders
        if (!isNearAnyDock) {
          for (let isl of islandsList) {
            const dx = ship.x - isl.x;
            const dz = ship.z - isl.z;
            const dist = Math.hypot(dx, dz);
            const islandBaseR = isl.r * 0.92;

            // Island cliff horizontal barrier
            if (dist < islandBaseR + SHIP_RADIUS && ship.y < isl.top + 1.2) {
              const nx = dx / (dist || 1);
              const nz = dz / (dist || 1);
              ship.x = isl.x + nx * (islandBaseR + SHIP_RADIUS);
              ship.z = isl.z + nz * (islandBaseR + SHIP_RADIUS);
              ship.speed = Math.max(-0.25, ship.speed * 0.2);
              collisionOccurred = true;
            }

            // Island ground surface (cannot burrow into terrain)
            if (dist < islandBaseR) {
              const minGroundY = isl.top + 2.2;
              if (ship.y < minGroundY) {
                ship.y = minGroundY;
                if (ship.targetAltitude < minGroundY) ship.targetAltitude = minGroundY + 0.5;
              }
            }
          }
        }

        // C. Village Islets Ground & Cliff
        for (let [ix, iz, ir] of islets) {
          const dx = ship.x - ix;
          const dz = ship.z - iz;
          const dist = Math.hypot(dx, dz);
          const isletR = ir * 0.88;
          const isletTop = 13.5;

          if (dist < isletR + SHIP_RADIUS && ship.y < isletTop + 1.0) {
            const nx = dx / (dist || 1);
            const nz = dz / (dist || 1);
            ship.x = ix + nx * (isletR + SHIP_RADIUS);
            ship.z = iz + nz * (isletR + SHIP_RADIUS);
            ship.speed = Math.max(-0.25, ship.speed * 0.2);
            collisionOccurred = true;
          }
        }

        // Collision Bump Feedback (Sound + Camera Shake + Visual tilt)
        if (collisionOccurred) {
          const nowTime = performance.now() * 0.001;
          if (nowTime - lastBumpTime > 0.35) {
            soundEngine.playBump();
            lastBumpTime = nowTime;
            camState.camBumpShake = 0.26;
            ship.roll += (Math.random() - 0.5) * 0.12;
          }
        }
      }

      // Animate World Boundary Ring & Celestial Boundary Clouds
      boundaryRing.rotation.z += delta * 0.04;
      boundaryInnerRing.rotation.z -= delta * 0.06;
      boundaryCloudPuffs.forEach((cp) => {
        cp.position.y = Math.sin(time * 0.7 + cp.userData.phase) * 1.6 - 1.8;
      });
      if (isNearBoundary) {
        boundaryRingMat.opacity = 0.65 + Math.sin(time * 6.0) * 0.22;
        boundaryInnerMat.opacity = 0.5 + Math.sin(time * 6.0) * 0.2;
      } else {
        boundaryRingMat.opacity = 0.32;
        boundaryInnerMat.opacity = 0.20;
      }

      airship.position.set(ship.x, ship.y, ship.z);
      airship.rotation.set(ship.pitch, ship.yaw, ship.roll);

      propGroup.rotation.z += (3 + ship.throttle * 24) * delta;
      soundEngine.updateEngine(ship.throttle);

      let closestIsl = null;
      let closestDist = Infinity;
      for (let isl of islandsList) {
        const d = Math.hypot(ship.x - isl.x, ship.z - isl.z);
        if (d < isl.r + 14 && d < closestDist) {
          closestDist = d;
          closestIsl = isl;
        }
      }
      nearestIslandRef.current = closestIsl;

      if (closestIsl && !ship.docked) {
        mooringRing.position.set(closestIsl.dockPos.x, closestIsl.dockPos.y - 0.4, closestIsl.dockPos.z);
        mooringRing.material.opacity = Math.sin(time * 4) * 0.25 + 0.55;
      } else {
        mooringRing.material.opacity = 0;
      }

      if (onFlightStatsRef.current) {
        onFlightStatsRef.current({
          speed: Math.round(Math.abs(ship.speed) * 35),
          heading: Math.round((((ship.yaw * 180) / Math.PI) % 360 + 360) % 360),
          altitude: Math.round(ship.y * 12),
          nearIsland: closestIsl ? closestIsl.title : null,
          nearIslandId: closestIsl ? closestIsl.id : null,
          isDocked: !!ship.docked,
          isNearBoundary: isNearBoundary,
          playerX: Math.round(ship.x),
          playerZ: Math.round(ship.z)
        });
      }

      // Camera Follow & Orbit with Game-Grade Rotational Damping
      camState.dist += (camState.targetDist - camState.dist) * (1 - Math.exp(-5 * delta));
      camState.yawOff += (camState.targetYawOff - camState.yawOff) * (1 - Math.exp(-6 * delta));
      camState.pitch += (camState.targetPitch - camState.pitch) * (1 - Math.exp(-6 * delta));

      // Auto-recenter camera behind the airship when flying forward
      if (keys.w && !camState.isDragging) {
        camState.targetYawOff += (0 - camState.targetYawOff) * (1 - Math.exp(-1.8 * delta));
      }

      // Smooth camera yaw tracking with elastic spring lag
      const targetYaw = ship.yaw + camState.yawOff;
      let dyaw = targetYaw - camSmoothYaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      camSmoothYaw += dyaw * (1 - Math.exp(-3.8 * delta));

      const desiredCamX = ship.x - Math.sin(camSmoothYaw) * Math.cos(camState.pitch) * camState.dist;
      const desiredCamZ = ship.z + Math.cos(camSmoothYaw) * Math.cos(camState.pitch) * camState.dist;
      const desiredCamY = ship.y + Math.sin(camState.pitch) * camState.dist + 3.0;

      camera.position.x += (desiredCamX - camera.position.x) * (1 - Math.exp(-8 * delta));
      camera.position.y += (desiredCamY - camera.position.y) * (1 - Math.exp(-8 * delta));
      camera.position.z += (desiredCamZ - camera.position.z) * (1 - Math.exp(-8 * delta));

      // Subtle Camera Bump Shake on Obstacle Impact
      if (camState.camBumpShake > 0.001) {
        camState.camBumpShake *= Math.exp(-7.0 * delta);
        const shakeX = Math.sin(time * 38.0) * camState.camBumpShake;
        const shakeY = Math.cos(time * 32.0) * camState.camBumpShake * 0.7;
        camera.position.x += shakeX;
        camera.position.y += shakeY;
      }

      camSmoothLook.x += (ship.x - camSmoothLook.x) * (1 - Math.exp(-10 * delta));
      camSmoothLook.y += ((ship.y + 1.2) - camSmoothLook.y) * (1 - Math.exp(-10 * delta));
      camSmoothLook.z += (ship.z - camSmoothLook.z) * (1 - Math.exp(-10 * delta));

      camera.lookAt(camSmoothLook);
      cloudUniforms.uCam.value.copy(camera.position);

      // Project 3D Island Labels to 2D Screen Space with directional arrows
      if (labelsContainerRef.current && showLabels) {
        const labelElements = labelsContainerRef.current.children;
        islandsList.forEach((isl, i) => {
          const el = labelElements[i];
          if (!el) return;

          const worldPos = new THREE.Vector3(isl.x, isl.top + 5.5, isl.z);
          const screenPos = worldPos.clone().project(camera);

          if (screenPos.z < 1.0) {
            const sx = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
            const sy = (-screenPos.y * 0.5 + 0.5) * container.clientHeight;
            el.style.transform = `translate(-50%, -100%) translate3d(${sx}px, ${sy}px, 0)`;
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';

            // Add arrow if island is off toward edges of screen (as in original Skyholm)
            const arrowSpan = el.querySelector('.arrow-indicator');
            if (arrowSpan) {
              if (screenPos.x > 0.45) {
                arrowSpan.textContent = ' →';
                arrowSpan.style.display = 'inline';
              } else if (screenPos.x < -0.45) {
                arrowSpan.textContent = '← ';
                arrowSpan.style.display = 'inline';
              } else {
                arrowSpan.textContent = '';
                arrowSpan.style.display = 'none';
              }
            }
          } else {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          }
        });
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (targetIsland && sceneRef.current && sceneRef.current.flyTo) {
      sceneRef.current.flyTo(targetIsland);
      setTargetIsland(null);
    }
  }, [targetIsland, setTargetIsland]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* 3D Projected Island Navigation Pills - EXACT MATCH TO SCREENSHOT */}
      <div
        ref={labelsContainerRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
      >
        {PORTFOLIO_DATA.islands.map((isl) => {
          return (
            <button
              key={isl.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (sceneRef.current && sceneRef.current.flyTo) {
                  sceneRef.current.flyTo(isl.id);
                }
              }}
              className="sa-pill absolute left-0 top-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full font-medium text-xs tracking-tight shadow-md hover:scale-105 pointer-events-auto transition-all bg-white/95 text-slate-800 border border-black/5 backdrop-blur-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B1F]" />
              <span className="font-semibold">{isl.title}</span>
              <span className="text-slate-400 font-normal">{isl.label}</span>
              <span className="arrow-indicator text-[#FF4B1F] font-semibold text-xs ml-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
