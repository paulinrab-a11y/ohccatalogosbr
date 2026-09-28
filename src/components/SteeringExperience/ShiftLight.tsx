/* Shift Light dinâmico: uma fileira de 10 LEDs (planos mínimos, material unlit) sobre a superfície real
   `Shift_Light_Display`, acendendo azul → verde → amarelo → vermelho com o scroll. A textura original não é
   alterada: o material do display é clonado e só recebe emissive quando os LEDs acendem. */
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SHIFT } from "./timeline";
const N = 10;
const COLORS = [
  "#2F7BFF",
  "#2F7BFF",
  "#2F7BFF",
  "#33D17A",
  "#33D17A",
  "#33D17A",
  "#F2C94C",
  "#F2C94C",
  "#FF3B30",
  "#FF3B30",
];
export default function ShiftLight({
  wheel,
  progress,
}: {
  wheel: THREE.Object3D;
  progress: MutableRefObject<number>;
}) {
  const leds = useRef<THREE.Mesh[]>([]);
  const display = useMemo(
    () => wheel.getObjectByName("Shift_Light_Display") as THREE.Mesh | null,
    [wheel],
  );
  /* posição/tamanho reais lidos do bounding box do display (coordenadas locais do modelo) */
  const box = useMemo(() => {
    if (!display) return null;
    display.geometry.computeBoundingBox();
    const b = display.geometry.boundingBox!.clone();
    return b;
  }, [display]);
  const dispMat = useRef<THREE.MeshStandardMaterial | null>(null);
  useEffect(() => {
    if (!display) return;
    const original = display.material;
    const m = (
      display.material as THREE.Material
    ).clone() as THREE.MeshStandardMaterial;
    display.material = m;
    if ("emissive" in m) {
      m.emissive = new THREE.Color("#000000");
      m.emissiveIntensity = 0;
    }
    dispMat.current = m;
    return () => {
      display.material = original;
      dispMat.current = null;
      m.dispose();
    };
  }, [display]);
  useFrame(() => {
    const p = progress.current;
    const t = Math.min(
      1,
      Math.max(0, (p - SHIFT.start) / (SHIFT.end - SHIFT.start)),
    );
    const lit = t * N;
    leds.current.forEach((led, i) => {
      if (!led) return;
      const on = Math.min(1, Math.max(0, lit - i));
      const m = led.material as THREE.MeshBasicMaterial;
      m.opacity = 0.12 + on * 0.88;
      led.scale.setScalar(1 + on * 0.15);
    });
    if (dispMat.current && "emissive" in dispMat.current) {
      const c =
        t < 0.33
          ? "#2F7BFF"
          : t < 0.66
            ? "#33D17A"
            : t < 0.85
              ? "#F2C94C"
              : "#FF3B30";
      (dispMat.current.emissive as THREE.Color).set(c);
      dispMat.current.emissiveIntensity = t * 0.9;
    }
  });
  if (!box) return null;
  const w = box.max.x - box.min.x,
    depth = box.max.z - box.min.z,
    y = box.max.y + 0.0006,
    cz = (box.min.z + box.max.z) / 2;
  const step = w / N,
    size = step * 0.62;
  return (
    <group>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) leds.current[i] = el;
          }}
          position={[box.min.x + step * (i + 0.5), y, cz]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[size, Math.min(size, depth * 0.7)]} />
          <meshBasicMaterial
            color={COLORS[i]}
            transparent
            opacity={0.12}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
