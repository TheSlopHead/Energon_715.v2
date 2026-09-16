import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Environment } from "@react-three/drei";

function Model() {
  const { scene } = useGLTF('/textured_mesh.glb');
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export default function BustScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Canvas camera={{position: [0, 0, 3], fov: 50}} gl={{ toneMappingExposure: 1.5 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <directionalLight position={[-5, 5, -5]} intensity={1.5} />
          <pointLight position={[0, 0, -5]} intensity={5} />
            <Environment preset="studio" />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls
          enableDamping
          enablePan={false}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/textured_mesh.glb');
