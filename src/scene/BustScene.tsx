import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Stats } from "@react-three/drei";
import type { Group, Mesh, Object3D } from "three";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/Energon715.glb");
  const groupRef = useRef<Group>(null);
  const cameraRef = useRef<Object3D | null>(null);
  const cdPlayerRef = useRef<Object3D | null>(null);
  const speedRef = useRef(0.4);
  const hoveredRef = useRef(false);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as Mesh).isMesh) {
        (o as Mesh).raycast = () => null;
      }
    });

    cameraRef.current = scene.getObjectByName("camera") ?? null;
    if (!cameraRef.current) {
      console.warn('Missing object in model: "camera"');
    }

    cdPlayerRef.current = scene.getObjectByName("cdplayer") ?? null;
    if (!cdPlayerRef.current) {
      console.warn('Missing object in model: "cdplayer"');
    }

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

    if (cameraRef.current) cameraRef.current.rotation.z += delta * 1;
    if (cdPlayerRef.current) cdPlayerRef.current.rotation.z += delta * 1;
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
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ alpha: true, toneMappingExposure: 1.5 }}
        style={{ background: "transparent" }}
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
