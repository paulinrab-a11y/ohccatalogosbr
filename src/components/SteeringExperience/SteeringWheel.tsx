/* Carrega o GLB real (public/models/steering-wheel-original.glb), reorienta para frente=+Z/topo=+Y,
   e aplica rotação/escala por scroll. Não altera geometria nem proporções (só scale uniforme). */
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { KEYS_DESKTOP, KEYS_MOBILE, PADDLE, sample, smooth } from "./timeline";
import ShiftLight from "./ShiftLight";
const GLB_URL = "/models/steering-wheel-original.glb";
type Props = {
  progress: MutableRefObject<number>;
  mobile: boolean;
  mouse: MutableRefObject<{ x: number; y: number }>;
  onReady?: () => void;
};
export default function SteeringWheel({
  progress,
  mobile,
  mouse,
  onReady,
}: Props) {
  const gltf = useGLTF(GLB_URL);
  const outer = useRef<THREE.Group>(null);
  const keys = mobile ? KEYS_MOBILE : KEYS_DESKTOP;
  /* pega o nó real do volante (sem o pai "Web_sun" girado, sem câmera/luzes do arquivo) */
  const wheel: THREE.Object3D = useMemo(() => {
    const w = (
      (gltf.scene.getObjectByName("Steering_Wheel") as THREE.Object3D) ||
      gltf.scene
    ).clone(true);
    w.traverse((node) => {
      if (node instanceof THREE.Mesh)
        node.material = Array.isArray(node.material)
          ? node.material.map((m) => m.clone())
          : node.material.clone();
    });
    w.updateMatrixWorld(true);
    return w;
  }, [gltf]);
  const ownedMaterials = useMemo(() => {
    const materials = new Set<THREE.Material>();
    wheel.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        for (const material of Array.isArray(node.material)
          ? node.material
          : [node.material])
          materials.add(material);
      }
    });
    return materials;
  }, [wheel]);
  useEffect(
    () => () => {
      for (const material of ownedMaterials) material.dispose();
    },
    [ownedMaterials],
  );
  const paddles = useMemo(
    () => ({
      L: wheel.getObjectByName("Left_Paddle") as THREE.Mesh | null,
      R: wheel.getObjectByName("Right_Paddle") as THREE.Mesh | null,
    }),
    [wheel],
  );
  const paddleBase = useRef<{ L?: THREE.Vector3; R?: THREE.Vector3 }>({});
  useEffect(() => {
    /* materiais: mantém PBR/clearcoat originais; só garante sombreamento correto e sem sombras caras */
    wheel.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = false;
        o.receiveShadow = false;
        o.frustumCulled = true;
        if (o.material && "envMapIntensity" in o.material)
          o.material.envMapIntensity = 1.6;
      }
    });
    if (paddles.L) paddleBase.current.L = paddles.L.position.clone();
    if (paddles.R) paddleBase.current.R = paddles.R.position.clone();
    onReady && onReady();
  }, [wheel]);
  useFrame(() => {
    const g = outer.current;
    if (!g) return;
    const p = progress.current;
    const k = sample(keys, p);
    /* rotação cinematográfica + parallax do mouse (só desktop, limites ±3° / ±5°) */
    const mx = mobile ? 0 : mouse.current.x,
      my = mobile ? 0 : mouse.current.y;
    g.rotation.set(
      k.rotX + my * THREE.MathUtils.degToRad(3),
      k.rotY + mx * THREE.MathUtils.degToRad(5),
      0,
    );
    g.scale.setScalar(k.scale);
    /* borboleta: puxa e volta (deslocamento curto em direção ao motorista, eixo +Y local do modelo) */
    const t =
      p <= PADDLE.start || p >= PADDLE.end
        ? 0
        : Math.sin(
            ((p - PADDLE.start) / (PADDLE.end - PADDLE.start)) * Math.PI,
          );
    const pull = smooth(t) * 0.006;
    if (paddles.R && paddleBase.current.R)
      paddles.R.position.set(
        paddleBase.current.R.x,
        paddleBase.current.R.y + pull,
        paddleBase.current.R.z,
      );
    if (paddles.L && paddleBase.current.L)
      paddles.L.position.set(
        paddleBase.current.L.x,
        paddleBase.current.L.y + pull * 0.35,
        paddleBase.current.L.z,
      );
  });
  return (
    <group ref={outer}>
      {/* reorientação: modelo tem frente em +Y e topo em -Z; +90° em X leva frente → +Z e topo → +Y */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={wheel} dispose={null} />
        <ShiftLight wheel={wheel} progress={progress} />
      </group>
    </group>
  );
}
useGLTF.preload(GLB_URL);
