/* Iluminação "split color" de estúdio automotivo: key neutra na frente (alto-esquerda), fill suave,
   e duas luzes de recorte coloridas atrás, azul OHC à esquerda e vermelho OHC à direita.
   Ambiente procedural (Lightformers) com as mesmas duas cores para o carbono e o metal refletirem. Sem sombras. */
import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { KEYS_DESKTOP, KEYS_MOBILE, sample } from "./timeline";
export default function SteeringLights({
  progress,
  mobile,
}: {
  progress: MutableRefObject<number>;
  mobile: boolean;
}) {
  const key = useRef<THREE.DirectionalLight>(null),
    fill = useRef<THREE.DirectionalLight>(null),
    rimB = useRef<THREE.DirectionalLight>(null),
    rimR = useRef<THREE.DirectionalLight>(null);
  const keys = mobile ? KEYS_MOBILE : KEYS_DESKTOP;
  useFrame(() => {
    const l = sample(keys, progress.current).light;
    if (key.current) key.current.intensity = 3.4 * l;
    if (fill.current) fill.current.intensity = 0.8 * l;
    if (rimB.current) rimB.current.intensity = 4.2 * l;
    if (rimR.current) rimR.current.intensity = 3.6 * l;
  });
  return (
    <>
      <ambientLight intensity={0.28} color="#8FA3C8" />
      <hemisphereLight args={["#DCE6FF", "#0B0D11", 0.5]} />
      <directionalLight
        ref={key}
        position={[-0.9, 1.5, 1.6]}
        color="#F2F5FF"
        intensity={0}
      />
      <directionalLight
        ref={fill}
        position={[1.2, 0.2, 1.4]}
        color="#9AA6B8"
        intensity={0}
      />
      <directionalLight
        ref={rimB}
        position={[-2.0, 0.9, -0.6]}
        color="#3B7BFF"
        intensity={0}
      />
      <pointLight
        position={[-0.9, 0.3, -0.35]}
        color="#3B7BFF"
        intensity={1.6}
        distance={2.5}
        decay={2}
      />
      <directionalLight
        ref={rimR}
        position={[2.0, 0.6, -0.6]}
        color="#ED1C24"
        intensity={0}
      />
      <pointLight
        position={[0.9, -0.1, -0.35]}
        color="#ED1C24"
        intensity={1.4}
        distance={2.5}
        decay={2}
      />
      <Environment resolution={256} frames={1}>
        <Lightformer
          intensity={2.0}
          color="#E9EEFF"
          position={[0, 2.2, 0.5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[6, 1.2, 1]}
          form="rect"
        />
        <Lightformer
          intensity={2.2}
          color="#3B7BFF"
          position={[-3.2, 0.6, -1.8]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[2.2, 4, 1]}
          form="rect"
        />
        <Lightformer
          intensity={1.9}
          color="#ED1C24"
          position={[3.2, 0.4, -1.8]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[2.2, 4, 1]}
          form="rect"
        />
        <Lightformer
          intensity={0.25}
          color="#0B0D11"
          position={[0, -3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
          form="rect"
        />
      </Environment>
    </>
  );
}
