import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { THANKS_MODEL_PATH } from "../lib/modelAssets";

export default function ThanksCharacterModel({ rotate = false, reduceMotion = false }: {
  rotate?: boolean;
  reduceMotion?: boolean;
}) {
  const { scene: source } = useGLTF(THANKS_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const model = useMemo(() => {
    const scene = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const height = bounds.getSize(new THREE.Vector3()).y;
    const normalized = new THREE.Group();
    scene.position.sub(center);
    normalized.add(scene);
    normalized.scale.setScalar(1.9 / height);
    return normalized;
  }, [source]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group || !rotate || reduceMotion) return;
    group.rotation.y += Math.min(delta, 0.1) * 0.24;
    group.position.y = Math.sin(clock.elapsedTime * 0.9) * 0.045;
  });

  return (
    <group ref={groupRef} rotation={[0, rotate ? -0.12 : 0, 0]}>
      <primitive object={model} />
    </group>
  );
}
