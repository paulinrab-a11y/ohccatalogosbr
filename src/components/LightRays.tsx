/* Ported from React Bits — LightRays (src/ts-tailwind/Backgrounds/LightRays/LightRays.tsx), ogl shader
   https://reactbits.dev/backgrounds/light-rays — MIT + Commons Clause © David Haz. Adapted: OHC blue rays, single WebGL surface per page, disabled with prefers-reduced-motion, lazy-started when visible. */
import { useEffect, useRef } from "react";
import { reduced } from "../lib/motion";
const VERT = `attribute vec2 position; varying vec2 vUv; void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;
const FRAG = `precision highp float; uniform float iTime; uniform vec2 iResolution; uniform vec2 rayPos; uniform vec2 rayDir; uniform vec3 raysColor; uniform float raysSpeed; uniform float lightSpread; uniform float rayLength; uniform float fadeDistance; uniform float saturation; uniform vec2 mousePos; uniform float mouseInfluence; uniform float noiseAmount; uniform float distortion; varying vec2 vUv;
float noise(vec2 st){ return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed){ vec2 sourceToCoord = coord - raySource; vec2 dirNorm = normalize(sourceToCoord); float cosAngle = dot(dirNorm, rayRefDirection); float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2; float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001)); float distance = length(sourceToCoord); float maxDistance = iResolution.x * rayLength; float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0); float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0); float pulse = 0.85 + 0.15 * sin(iTime * speed * 3.0); float baseStrength = clamp((0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)), 0.0, 1.0); return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse; }
void main(){ vec2 fragCoord = vUv * iResolution; vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y); vec2 finalRayDir = rayDir; if (mouseInfluence > 0.0) { vec2 mouseScreenPos = mousePos * iResolution; vec2 mouseDirection = normalize(mouseScreenPos - rayPos); finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence)); } vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed); vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed); vec4 fragColor = rays1 * 0.5 + rays2 * 0.4; if (noiseAmount > 0.0) { float n = noise(coord * 0.01 + iTime * 0.1); fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n); } float brightness = 1.0 - (coord.y / iResolution.y); fragColor.x *= 0.1 + brightness * 0.8; fragColor.y *= 0.3 + brightness * 0.6; fragColor.z *= 0.5 + brightness * 0.5; if (saturation != 1.0) { float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114)); fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation); } fragColor.rgb *= raysColor; gl_FragColor = fragColor; }`;
const hex = (h: string): [number, number, number] => {
  const m = h.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16) / 255,
    parseInt(m.slice(2, 4), 16) / 255,
    parseInt(m.slice(4, 6), 16) / 255,
  ];
};
type Props = {
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
};
export default function LightRays({
  raysColor = "#3B7BFF",
  raysSpeed = 0.6,
  lightSpread = 0.9,
  rayLength = 1.6,
  followMouse = true,
  mouseInfluence = 0.08,
  noiseAmount = 0.05,
  distortion = 0.04,
  className = "",
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced() || !host.current) return;
    const el = host.current;
    let cleanup = () => {};
    let started = false;
    let alive = true;
    const start = async () => {
      if (started) return;
      started = true;
      try {
        const { Renderer, Program, Triangle, Mesh } = await import("ogl");
        if (!alive) return;
        const renderer = new Renderer({
          dpr: Math.min(devicePixelRatio, 1.5),
          alpha: true,
        });
        const gl = renderer.gl;
        gl.canvas.style.width = "100%";
        gl.canvas.style.height = "100%";
        el.appendChild(gl.canvas);
        const uniforms = {
          iTime: { value: 0 },
          iResolution: { value: [1, 1] },
          rayPos: { value: [0, 0] },
          rayDir: { value: [0, 1] },
          raysColor: { value: hex(raysColor) },
          raysSpeed: { value: raysSpeed },
          lightSpread: { value: lightSpread },
          rayLength: { value: rayLength },
          fadeDistance: { value: 1 },
          saturation: { value: 1 },
          mousePos: { value: [0.5, 0.5] },
          mouseInfluence: { value: mouseInfluence },
          noiseAmount: { value: noiseAmount },
          distortion: { value: distortion },
        };
        const program = new Program(gl, {
          vertex: VERT,
          fragment: FRAG,
          uniforms,
        });
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
        const mouse = { x: 0.5, y: 0.5 },
          smooth = { x: 0.5, y: 0.5 };
        const resize = () => {
          const w = el.clientWidth,
            h = el.clientHeight;
          renderer.setSize(w, h);
          const d = renderer.dpr;
          uniforms.iResolution.value = [w * d, h * d];
          uniforms.rayPos.value = [w * d * 0.5, -0.02 * h * d];
          uniforms.rayDir.value = [0, 1];
        };
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          mouse.x = (e.clientX - r.left) / r.width;
          mouse.y = (e.clientY - r.top) / r.height;
        };
        if (followMouse)
          addEventListener("mousemove", onMove, { passive: true });
        addEventListener("resize", resize);
        resize();
        let raf = 0,
          visible = true;
        const io = new IntersectionObserver((es) =>
          es.forEach((e) => (visible = e.isIntersecting)),
        );
        io.observe(el);
        const loop = (t: number) => {
          raf = requestAnimationFrame(loop);
          if (!visible || document.hidden) return;
          uniforms.iTime.value = t * 0.001;
          smooth.x += (mouse.x - smooth.x) * 0.06;
          smooth.y += (mouse.y - smooth.y) * 0.06;
          uniforms.mousePos.value = [smooth.x, smooth.y];
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);
        cleanup = () => {
          cancelAnimationFrame(raf);
          io.disconnect();
          removeEventListener("mousemove", onMove);
          removeEventListener("resize", resize);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
          gl.canvas.remove();
        };
      } catch {
        /* WebGL unavailable: the CSS gradient behind stays */
      }
    };
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        start();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
      cleanup();
    };
  }, []);
  return (
    <div
      ref={host}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
