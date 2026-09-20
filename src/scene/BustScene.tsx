import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Stats } from "@react-three/drei";
import * as THREE from "three";
import { usePanelStore } from "../store/usePanelStore";

function Model() {
  const setActivePanel = usePanelStore((state) => state.setActivePanel);
  const { scene: source } = useGLTF("/Energon715.glb");
  const groupRef = useRef<THREE.Group>(null);
  const brainHoveredRef = useRef(false);
  const rotationSpeedRef = useRef(1);

  const model = useMemo(() => {
    const scene = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    scene.scale.multiplyScalar(2 / bounds.getSize(new THREE.Vector3()).y);
    bounds.setFromObject(scene);
    scene.position.sub(bounds.getCenter(new THREE.Vector3()));
    scene.updateMatrixWorld(true);

    const brainBounds = new THREE.Box3();
    const brainMaterials: THREE.MeshStandardMaterial[] = [];
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      // A simple brain hit area avoids raycasting the dense scanned geometry.
      object.raycast = () => {};
      if (!object.name.startsWith("Brain_Part_")) return;
      brainBounds.union(new THREE.Box3().setFromObject(object));
      const highlight = (material: THREE.Material) => {
        const copy = material.clone();
        if (copy instanceof THREE.MeshStandardMaterial) brainMaterials.push(copy);
        return copy;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(highlight)
        : highlight(object.material);
    });

    return {
      scene,
      brainBounds,
      brainCenter: brainBounds.getCenter(new THREE.Vector3()),
      brainSize: brainBounds.getSize(new THREE.Vector3()).multiplyScalar(0.55),
      brainMaterials,
      camera: scene.getObjectByName("camera"),
      cdPlayer: scene.getObjectByName("cdplayer"),
    };
  }, [source]);

  const animatedModelRef = useRef<typeof model | null>(null);
  useEffect(() => {
    animatedModelRef.current = model;
    return () => {
      animatedModelRef.current = null;
      model.brainMaterials.forEach((material) => material.dispose());
    };
  }, [model]);

  const projection = useMemo(() => ({ point: new THREE.Vector3() }), []);

  useFrame(({ camera, size }, delta) => {
    const group = groupRef.current;
    const model = animatedModelRef.current;
    if (!group || !model) return;
    const { activePanel, setPanelAnchor } = usePanelStore.getState();
    if (activePanel !== null) {
      rotationSpeedRef.current = 0;
    } else {
      const targetSpeed = brainHoveredRef.current ? 0 : 1;
      // Exponential damping stays stable even when a frame takes a long time.
      rotationSpeedRef.current = THREE.MathUtils.damp(
        rotationSpeedRef.current, targetSpeed, 6, delta,
      );
      if (Math.abs(rotationSpeedRef.current - targetSpeed) < 0.001) {
        rotationSpeedRef.current = targetSpeed;
      }
      // Bound long frames so background tabs and slow GPUs cannot cause jumps.
      const step = Math.min(delta, 0.1) * rotationSpeedRef.current;
      group.rotation.y += 0.4 * step;
      if (model.camera) model.camera.rotation.z += step;
      if (model.cdPlayer) model.cdPlayer.rotation.z += step;
    }

    for (const material of model.brainMaterials) {
      material.setValues({
        emissive: brainHoveredRef.current ? "#ff4293" : "#000000",
        emissiveIntensity: brainHoveredRef.current ? 1.5 : 0,
      });
    }

    // Project the brain's bounds, so the panel follows the model and viewport.
    group.updateWorldMatrix(true, false);
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    for (const x of [model.brainBounds.min.x, model.brainBounds.max.x]) {
      for (const y of [model.brainBounds.min.y, model.brainBounds.max.y]) {
        for (const z of [model.brainBounds.min.z, model.brainBounds.max.z]) {
          const point = projection.point.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera);
          left = Math.min(left, (point.x + 1) * size.width / 2);
          right = Math.max(right, (point.x + 1) * size.width / 2);
          top = Math.min(top, (1 - point.y) * size.height / 2);
        }
      }
    }
    setPanelAnchor({ x: (left + right) / 2, y: top });
  });

  return (
    <group ref={groupRef}>
      <primitive object={model.scene} />
      <mesh
        name="brain-hit-area"
        position={model.brainCenter}
        scale={model.brainSize}
        visible={false}
        onPointerOver={() => { brainHoveredRef.current = true; }}
        onPointerOut={() => { brainHoveredRef.current = false; }}
        onClick={() => setActivePanel("brain")}
      >
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
    </group>
  );
}

export default function BustScene() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "transparent", position: "relative", zIndex: 1 }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} gl={{ alpha: true, toneMappingExposure: 1.5 }} style={{ background: "transparent" }}>
        <Stats />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Environment preset="city" />
        <Suspense fallback={null}><Model /></Suspense>
        <OrbitControls enableRotate={false} enableZoom={false} enablePan={false} minDistance={2} maxDistance={10} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/Energon715.glb");
