import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const CAT_MODEL_PATH = "/Yuda_cat.glb";
const ROTATION_SPEED = 0.22;
const CAMERA_DISTANCE = 5.2;
const CAMERA_FOV = 38;

useGLTF.setDecoderPath("/draco/");

function Cat({ onReady }: { onReady: () => void }) {
  const { scene: source } = useGLTF(CAT_MODEL_PATH);
  const canvasSize = useThree((state) => state.size);
  const cat = useMemo(() => {
    const scene = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const visibleWidth =
      2 * CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2)) *
      (canvasSize.width / canvasSize.height);
    const scale = Math.min(5.1, visibleWidth * 0.84) / Math.max(size.x, size.y, size.z, 0.01);

    return {
      scene,
      scale,
      position: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number],
    };
  }, [source, canvasSize.width, canvasSize.height]);
  const groupRef = useRef<THREE.Group>(null);
  const readyRef = useRef(false);
  const reduceMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
    }

    if (reduceMotion) return;
    group.rotation.y = clock.elapsedTime * ROTATION_SPEED;
    group.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.045;
  });

  return (
    <group ref={groupRef}>
      <primitive object={cat.scene} scale={cat.scale} position={cat.position} />
    </group>
  );
}

export default function LoadingCat({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.2, CAMERA_DISTANCE], fov: CAMERA_FOV, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.15 }}
    >
      <ambientLight intensity={1.3} />
      <hemisphereLight color="#ffffff" groundColor="#6d8fae" intensity={1.2} />
      <directionalLight position={[-3, 5, 5]} color="#fff8f3" intensity={2.4} />
      <directionalLight position={[4, 1, 2]} color="#dcecff" intensity={1.1} />
      <directionalLight position={[0, 3, -4]} color="#eaf7ff" intensity={2.1} />
      <Suspense fallback={null}>
        <Cat onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
