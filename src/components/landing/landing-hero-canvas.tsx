"use client";

import * as React from "react";
import * as THREE from "three";

/**
 * The week's post, caught mid-flight: instanced paper envelopes drifting in a
 * slow current over a faint ink-wash field. Follows the house WebGL contract
 * (see paper-texture-layer.tsx): DPR capped, ~30fps budget, idle-deferred
 * init, pauses when hidden, static frame under reduced motion, full disposal
 * on unmount. If WebGL fails the canvas stays transparent and the global
 * paper layer simply shows through — the page never depends on this.
 */

const FRAME_INTERVAL = 1000 / 30;

// Ink-wash field: three octaves of value noise advected sideways, tinted with
// the house green at whisper opacity so the cream paper stays the page.
const WASH_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 p = vUv * 3.0;
    float t = uTime * 0.03 + uScroll * 0.4;
    float n = noise(p + vec2(t, 0.0)) * 0.55
            + noise(p * 2.3 - vec2(t * 0.7, t * 0.2)) * 0.3
            + noise(p * 5.1 + vec2(0.0, t * 0.5)) * 0.15;
    // A soft current of ink green, strongest in a diagonal band.
    float band = smoothstep(0.15, 0.65, 1.0 - abs(vUv.y - (0.35 + 0.25 * sin(uTime * 0.05))));
    float ink = smoothstep(0.45, 0.85, n) * band;
    vec3 green = vec3(0.0, 0.31, 0.23);   // #004f3b
    vec3 amber = vec3(0.88, 0.44, 0.0);   // #e17100
    vec3 tint = mix(green, amber, smoothstep(0.75, 0.95, n) * 0.35);
    gl_FragColor = vec4(tint, ink * 0.05);
  }
`;

const WASH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Paint one envelope onto an offscreen canvas: cream paper, ink flap lines,
 *  an amber stamp. One texture shared by every instance. */
function makeEnvelopeTexture(): THREE.CanvasTexture | null {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 176;
  const g = c.getContext("2d");
  if (!g) return null;
  // Paper
  g.fillStyle = "#fffdf6";
  g.fillRect(0, 0, 256, 176);
  g.strokeStyle = "rgba(0, 79, 59, 0.35)";
  g.lineWidth = 3;
  g.strokeRect(3, 3, 250, 170);
  // Flap
  g.strokeStyle = "rgba(0, 79, 59, 0.28)";
  g.beginPath();
  g.moveTo(4, 6);
  g.lineTo(128, 92);
  g.lineTo(252, 6);
  g.stroke();
  // Stamp
  g.fillStyle = "rgba(225, 113, 0, 0.85)";
  g.fillRect(206, 18, 32, 40);
  g.fillStyle = "#fffdf6";
  g.fillRect(212, 24, 20, 28);
  g.fillStyle = "rgba(0, 79, 59, 0.5)";
  g.fillRect(216, 30, 12, 16);
  // Address lines
  g.strokeStyle = "rgba(0, 79, 59, 0.22)";
  g.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.moveTo(56, 108 + i * 18);
    g.lineTo(200 - i * 34, 108 + i * 18);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}

type Drift = {
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
  spin: number;
  scale: number;
  flutter: number; // per-letter flutter frequency
  // Eased reactive offsets (cursor push / scroll gust), lerped each frame so
  // the response is springy rather than jittery.
  ox: number;
  oy: number;
  lean: number;
};

export default function LandingHeroCanvas() {
  const hostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    let idleHandle: number | null = null;
    const cleanups: (() => void)[] = [];

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    function init() {
      if (disposed || !host) return;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL — the paper layer shows through, nothing breaks
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
      camera.position.set(0, 0, 11);

      // Ink-wash backdrop
      const washMat = new THREE.ShaderMaterial({
        vertexShader: WASH_VERTEX,
        fragmentShader: WASH_FRAGMENT,
        uniforms: { uTime: { value: 0 }, uScroll: { value: 0 } },
        transparent: true,
        depthWrite: false
      });
      const wash = new THREE.Mesh(new THREE.PlaneGeometry(46, 30), washMat);
      wash.position.z = -6;
      scene.add(wash);

      // Drifting envelopes
      const texture = makeEnvelopeTexture();
      const envMat = new THREE.MeshBasicMaterial({
        map: texture ?? undefined,
        transparent: true,
        // Ambient, not foreground — the envelopes are atmosphere behind the
        // type, so the hero copy stays fully legible over them.
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const count = reduceMotion ? 8 : isMobile ? 10 : 18;
      const geo = new THREE.PlaneGeometry(1.45, 1.0);
      const mesh = new THREE.InstancedMesh(geo, envMat, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);

      const drifts: Drift[] = [];
      const rand = (a: number, b: number) => a + Math.random() * (b - a);
      for (let i = 0; i < count; i++) {
        drifts.push({
          x: rand(-11, 11),
          y: rand(-6, 6),
          z: rand(-4.5, 1.5),
          speed: rand(0.12, 0.35),
          phase: rand(0, Math.PI * 2),
          spin: rand(-0.25, 0.25),
          scale: rand(0.5, 1.15),
          flutter: rand(1.6, 3.2),
          ox: 0,
          oy: 0,
          lean: 0
        });
      }

      const dummy = new THREE.Object3D();
      const pointer = { x: 0, y: 0 };
      let scrollDrift = 0;
      let scrollGust = 0; // decaying horizontal shove from fast scrolling
      let paused = false;
      let last = 0;

      // Cursor field: envelopes near the pointer are pushed away and swirl a
      // little around it, then spring back when the cursor leaves. Reactive but
      // never busy — the response eases, and closer letters feel it more.
      const PUSH_RADIUS = 5.5;
      const PUSH_STRENGTH = 3.4;
      const SWIRL_STRENGTH = 1.6;
      const EASE = 0.09;

      const layout = (time: number, pointerWorldX: number, pointerWorldY: number, interactive: boolean) => {
        for (let i = 0; i < count; i++) {
          const d = drifts[i];
          const t = time * d.speed + d.phase;
          const bx = ((d.x + time * d.speed * 1.6 + scrollDrift * 2 + 15) % 30) - 15;
          const by = d.y + Math.sin(t) * 0.7;

          let targetOx = scrollGust * (0.5 + d.scale * 0.5);
          let targetOy = 0;
          let targetLean = 0;
          if (interactive) {
            const dx = bx - pointerWorldX;
            const dy = by - pointerWorldY;
            const dist = Math.hypot(dx, dy) || 0.0001;
            if (dist < PUSH_RADIUS) {
              const falloff = 1 - dist / PUSH_RADIUS;
              const force = falloff * falloff;
              const depth = 0.45 + ((d.z + 4.5) / 6) * 0.55; // nearer letters react more
              const nx = dx / dist;
              const ny = dy / dist;
              targetOx += (nx * PUSH_STRENGTH - ny * SWIRL_STRENGTH) * force * depth;
              targetOy += (ny * PUSH_STRENGTH + nx * SWIRL_STRENGTH) * force * depth;
              targetLean = -nx * force * 0.6; // bank away from the cursor
            }
          }

          d.ox += (targetOx - d.ox) * EASE;
          d.oy += (targetOy - d.oy) * EASE;
          d.lean += (targetLean - d.lean) * EASE;

          const flutter = Math.sin(time * d.flutter + d.phase) * 0.14;
          dummy.position.set(bx + d.ox, by + d.oy, d.z);
          dummy.rotation.set(
            Math.sin(t * 0.6) * 0.18 + flutter,
            Math.sin(t * 0.4) * 0.28 + d.lean,
            d.spin + Math.sin(t * 0.5) * 0.12 + d.ox * 0.05
          );
          dummy.scale.setScalar(d.scale);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      };

      const resize = () => {
        if (!renderer || !host) return;
        const { clientWidth: w, clientHeight: h } = host;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
      };
      resize();

      // Half-extent of the z=0 plane in view — maps the normalized pointer into
      // world space so the cursor field lines up with what's on screen.
      const halfHeightAt0 = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;

      const render = (now: number) => {
        if (disposed || paused) return;
        raf = requestAnimationFrame(render);
        if (now - last < FRAME_INTERVAL) return;
        last = now;
        const time = now / 1000;
        washMat.uniforms.uTime.value = time;
        washMat.uniforms.uScroll.value = scrollDrift;
        camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.04;
        camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        scrollGust *= 0.9; // decay the shove
        const halfW = halfHeightAt0 * camera.aspect;
        layout(time, camera.position.x + pointer.x * halfW, camera.position.y + pointer.y * halfHeightAt0, true);
        renderer!.render(scene, camera);
      };

      if (reduceMotion) {
        // One composed still — the scene, no drift, no loop, no cursor field.
        layout(4, 999, 999, false);
        renderer.render(scene, camera);
      } else {
        raf = requestAnimationFrame(render);

        const onPointer = (e: PointerEvent) => {
          pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
          pointer.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        let prevScrollY = window.scrollY;
        const onScroll = () => {
          scrollDrift = Math.min(window.scrollY / window.innerHeight, 1.5);
          // A fast flick sends a gust through the letters; a slow scroll barely does.
          const dv = (window.scrollY - prevScrollY) / window.innerHeight;
          prevScrollY = window.scrollY;
          scrollGust = Math.max(-4, Math.min(4, scrollGust - dv * 10));
        };
        let hidden = false;
        let offscreen = false;
        const applyPause = () => {
          const next = hidden || offscreen;
          if (next === paused) return;
          paused = next;
          if (!paused) raf = requestAnimationFrame(render);
        };
        const onVisibility = () => {
          hidden = document.hidden;
          applyPause();
        };
        // Stop rendering entirely once the hero is scrolled away — no reason
        // to burn battery under three screens of prose.
        const io = new IntersectionObserver(([entry]) => {
          offscreen = !entry.isIntersecting;
          applyPause();
        });
        io.observe(host);
        window.addEventListener("pointermove", onPointer, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
        cleanups.push(() => {
          io.disconnect();
          window.removeEventListener("pointermove", onPointer);
          window.removeEventListener("scroll", onScroll);
          document.removeEventListener("visibilitychange", onVisibility);
        });
      }

      const onResize = () => resize();
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        geo.dispose();
        envMat.dispose();
        texture?.dispose();
        wash.geometry.dispose();
        washMat.dispose();
        renderer?.dispose();
        renderer?.forceContextLoss();
        renderer?.domElement.remove();
      });
    }

    // Never compete with first paint. (Optional-call form: Safari still lacks
    // requestIdleCallback, even though lib.dom types it as always present.)
    const ric: typeof window.requestIdleCallback | undefined = window.requestIdleCallback?.bind(window);
    if (ric) {
      idleHandle = ric(init, { timeout: 900 });
    } else {
      const t = window.setTimeout(init, 350);
      cleanups.push(() => window.clearTimeout(t));
    }

    return () => {
      disposed = true;
      if (idleHandle !== null) window.cancelIdleCallback?.(idleHandle);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" />;
}
