/* Canvas R3F: DPR limitado, sem sombras, ACES tone mapping, sRGB. */
import { Suspense, useRef, useState, type MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import SteeringWheel from "./SteeringWheel";
import SteeringCamera from "./SteeringCamera";
import SteeringLights from "./SteeringLights";
import FrameGovernor from "./FrameGovernor";
type Props = {
  progress: MutableRefObject<number>;
  mouse: MutableRefObject<{ x: number; y: number }>;
  mobile: boolean;
  onReady: () => void;
  onError: () => void;
  host: HTMLElement | null;
};
export default function SteeringScene({
  progress,
  mouse,
  mobile,
  onReady,
  onError,
  host,
}: Props) {
  const kick = useRef(0);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  return (
    <Canvas
      dpr={mobile ? [1, 1.25] : [1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{
        fov: mobile ? 38 : 34,
        near: 0.05,
        far: 20,
        position: [0, 0, mobile ? 1.45 : 1.05],
      }}
      frameloop={frameloop}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMappingExposure = 1.25;
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onError();
          },
          { once: true },
        );
      }}
    >
      <Suspense fallback={null}>
        <SteeringLights progress={progress} mobile={mobile} />
        <SteeringWheel
          progress={progress}
          mobile={mobile}
          mouse={mouse}
          onReady={() => {
            kick.current++;
            onReady();
          }}
        />
      </Suspense>
      <SteeringCamera progress={progress} mobile={mobile} />
      <FrameGovernor
        progress={progress}
        mouse={mouse}
        kick={kick}
        host={host}
        onMode={setFrameloop}
      />
    </Canvas>
  );
}
