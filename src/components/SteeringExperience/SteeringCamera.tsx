/* Câmera guiada pelo scroll: posição e alvo interpolados dos keyframes, com suavização leve. */
import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { KEYS_DESKTOP, KEYS_MOBILE, sample } from "./timeline";
export default function SteeringCamera({
  progress,
  mobile,
}: {
  progress: MutableRefObject<number>;
  mobile: boolean;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(0, 0, mobile ? 1.45 : 1.05));
  const keys = mobile ? KEYS_MOBILE : KEYS_DESKTOP;
  useFrame((_, dt) => {
    const k = sample(keys, progress.current);
    const a = 1 - Math.pow(0.001, dt); // suavização independente de fps
    pos.current.lerp(new THREE.Vector3(...k.cam), a);
    look.current.lerp(new THREE.Vector3(...k.look), a);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    const fov = mobile ? 38 : 34;
    if ((camera as THREE.PerspectiveCamera).fov !== fov) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
