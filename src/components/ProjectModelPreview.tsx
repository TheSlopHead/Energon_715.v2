import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface ProjectModelPreviewProps {
  path: string;
}

function ProjectModel({ path }: ProjectModelPreviewProps) {
  const { scene: source } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);
  const model = useMemo(() => {
    const scene = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 2.15 / Math.max(size.x, size.y, size.z);
    scene.scale.multiplyScalar(scale);
    bounds.setFromObject(scene);
    scene.position.sub(bounds.getCenter(new THREE.Vector3()));
    return scene;
  }, [source]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += Math.min(delta, 0.1) * 0.16;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.035;
  });

  return (
    <group ref={groupRef} rotation={[-0.08, -0.38, 0]}>
      <primitive object={model} />
    </group>
  );
}

export default function ProjectModelPreview({ path }: ProjectModelPreviewProps) {
  return (
    <span className="neural-model-preview" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.1, 4.2], fov: 34 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, toneMappingExposure: 0.85 }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 4]} intensity={2.2} />
        <directionalLight position={[-3, 1, -2]} intensity={0.55} color="#7890a6" />
        <Suspense fallback={null}>
          <ProjectModel path={path} />
        </Suspense>
      </Canvas>
    </span>
  );
}
