import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Center,
  Environment,
  Stats,
} from "@react-three/drei";
import type { Group, Mesh } from "three";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/Energon715.glb");
  const groupRef = useRef<Group>(null);
  const speedRef = useRef(0.4);
  const hoveredRef = useRef(false);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as Mesh).isMesh) {
        (o as Mesh).raycast = () => null;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());

    const targetHeight = 2;
    const scale = targetHeight / size.y;
    scene.scale.setScalar(scale);

    const newBox = new THREE.Box3().setFromObject(scene);
    const center = newBox.getCenter(new THREE.Vector3());
    scene.position.sub(center);
  }, [scene]);

  const stop = () => (hoveredRef.current = true);
  const go = () => (hoveredRef.current = false);

  useFrame((_, delta) => {
    const target = hoveredRef.current ? 0 : 0.4;
    speedRef.current += (target - speedRef.current) * delta * 4;
    if (groupRef.current)
      groupRef.current.rotation.y += speedRef.current * delta;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />

      <mesh
        position={[0, 0.9, 0]}
        visible={false}
        onPointerOver={stop}
        onPointerOut={go}
      >
        <sphereGeometry args={[0.6, 8, 8]} />
      </mesh>
    </group>
  );
}

export default function BustScene() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ toneMappingExposure: 1.5 }}
      >
        <Stats />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls
          enableRotate={false}
          enableZoom={false}
          enablePan={false}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/Energon715.glb");
