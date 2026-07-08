"use client";

import * as React from "react";

/**
 * PaperTextureLayer — one shared full-screen WebGL canvas behind all app
 * content, rendering an ambient handmade-paper texture: fine grain, soft
 * fibre variation, and slow tonal drift between the three paper tones.
 *
 * Performance contract (see design brief):
 * - single canvas, fullscreen triangle, one tiny fragment shader
 * - 3 cheap value-noise taps, no FBM loops / texture sampling / derivatives
 * - DPR capped at 1.25 (mobile) / 1.5 (desktop)
 * - frame rate capped ~24fps; drift period ~24s
 * - pauses when the tab is hidden; static frame under reduced motion
 * - lazy-initialised after first paint; CSS fallback always painted beneath
 */

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 u_res;
uniform float u_t;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.y;

  // Base papers: #FEF9EE, #FEF3C6, #DEDAD4
  vec3 base = vec3(0.996, 0.976, 0.933);
  vec3 warm = vec3(0.996, 0.953, 0.776);
  vec3 grey = vec3(0.871, 0.855, 0.831);

  float drift = u_t * 0.042; // full character change over ~24s

  // Broad tonal wash, barely there.
  float tone = vnoise(uv * 2.6 + vec2(drift, -drift * 0.6));
  // Softer mid-scale fibre clouds.
  float fibre = vnoise(uv * 11.0 - vec2(drift * 0.4, drift * 0.25));
  // Static fine tooth of the paper (no time term — grain must not swim).
  float grain = vnoise(uv * 240.0);

  vec3 col = mix(base, warm, tone * 0.085);
  col = mix(col, grey, fibre * 0.055);
  col += (grain - 0.5) * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

function startShader(canvas: HTMLCanvasElement, reducedMotion: boolean): (() => void) | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power"
  });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One fullscreen triangle.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "u_res");
  const uTime = gl.getUniformLocation(program, "u_t");

  const resize = () => {
    const dprCap = window.innerWidth < 768 ? 1.25 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const width = Math.round(window.innerWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };

  let raf = 0;
  let lastFrame = 0;
  const started = performance.now();
  const FRAME_INTERVAL = 1000 / 24;

  const renderFrame = (now: number) => {
    gl.uniform1f(uTime, (now - started) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_INTERVAL) return;
    lastFrame = now;
    renderFrame(now);
  };

  resize();
  renderFrame(performance.now());

  const onVisibility = () => {
    if (reducedMotion) return;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      raf = requestAnimationFrame(loop);
    }
  };

  window.addEventListener("resize", resize);
  if (!reducedMotion) {
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

export function PaperTextureLayer() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [alive, setAlive] = React.useState(false);

  React.useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;

    // Defer shader start until the browser is idle so it never competes
    // with first paint or navigation.
    const idle =
      "requestIdleCallback" in window
        ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 1200 })
        : (cb: () => void) => window.setTimeout(cb, 350);

    idle(() => {
      if (cancelled || !canvasRef.current) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cleanup = startShader(canvasRef.current, reducedMotion);
      if (cleanup) setAlive(true); // else the CSS fallback simply stays visible
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className="paper-canvas-fallback fixed inset-0 -z-10" aria-hidden style={{ pointerEvents: "none" }}>
      <canvas
        ref={canvasRef}
        className="h-full w-full transition-opacity duration-700"
        style={{ opacity: alive ? 1 : 0 }}
      />
    </div>
  );
}
