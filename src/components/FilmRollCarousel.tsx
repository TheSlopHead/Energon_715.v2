import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { films } from "../../data/photos";

type Film = (typeof films)[number];
const modelCount = new Set(films.flatMap((film) => film.model ? [film.model] : [])).size;

function RollModel({ path, onLoad }: { path: string; onLoad: (path: string) => void }) {
  const { scene } = useGLTF(path);
  const object = useMemo(() => scene.clone(true), [scene]);
  const { scale, offset } = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.55 / Math.max(size.y, 0.01);
    return { scale, offset: center.multiplyScalar(-scale) };
  }, [object]);

  useEffect(() => {
    onLoad(path);
  }, [onLoad, path]);

  return <primitive object={object} scale={scale} position={offset} />;
}

function PlaceholderRoll() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.81, 0.81, 2.14, 32]} />
        <meshStandardMaterial color="#ad8f5d" metalness={0.25} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.11, 0]}>
        <cylinderGeometry args={[0.84, 0.84, 0.14, 32]} />
        <meshStandardMaterial color="#25221d" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.11, 0]}>
        <cylinderGeometry args={[0.84, 0.84, 0.14, 32]} />
        <meshStandardMaterial color="#25221d" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.26, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.24, 24]} />
        <meshStandardMaterial color="#25221d" metalness={0.45} roughness={0.5} />
      </mesh>
    </group>
  );
}

function relativeSlot(index: number, progress: number) {
  // Wrap at the far slot, beyond the visible neighbors, so edge rolls can slide away.
  const offset = index - progress + films.length / 2;
  return ((offset % films.length) + films.length) % films.length - films.length / 2;
}

function Roll({ film, index, activeStep, onModelLoad }: {
  film: Film;
  index: number;
  activeStep: number;
  onModelLoad: (path: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const progress = useRef(activeStep);
  const viewport = useThree((state) => state.viewport);
  const narrow = viewport.width < 5;

  useFrame(({ clock }, delta) => {
    if (!group.current) return;

    progress.current = THREE.MathUtils.damp(progress.current, activeStep, 5, delta);
    if (Math.abs(progress.current - activeStep) < 0.001) progress.current = activeStep;

    const relative = relativeSlot(index, progress.current);
    const sideBlend = Math.min(Math.abs(relative), 1);
    const sideX = viewport.width * (narrow ? 0.52 : 0.37);
    const sideDirection = THREE.MathUtils.clamp(relative, -1, 1);

    group.current.position.set(
      relative * sideX,
      sideBlend * 0.12 + Math.sin(clock.elapsedTime * 0.55 + index) * 0.035,
      -sideBlend * 0.9,
    );
    group.current.scale.setScalar(
      THREE.MathUtils.lerp(narrow ? 0.72 : 1, narrow ? 0.46 : 0.76, sideBlend),
    );
    group.current.rotation.y = THREE.MathUtils.lerp(-0.17, sideDirection * -0.34, sideBlend)
      + Math.sin(clock.elapsedTime * 0.38 + index) * 0.035;
    group.current.rotation.z = THREE.MathUtils.lerp(-0.14, sideDirection * 0.12, sideBlend);
  });

  return (
    <group ref={group}>
      {film.model ? (
        <Suspense fallback={null}>
          <RollModel path={film.model} onLoad={onModelLoad} />
        </Suspense>
      ) : (
        <PlaceholderRoll />
      )}
    </group>
  );
}

export default function FilmRollCarousel({ activeStep, onReady }: {
  activeStep: number;
  onReady: () => void;
}) {
  const loadedModels = useRef(new Set<string>());
  const onModelLoad = useCallback((path: string) => {
    loadedModels.current.add(path);
    if (loadedModels.current.size >= modelCount) onReady();
  }, [onReady]);

  useEffect(() => {
    if (modelCount === 0) onReady();
  }, [onReady]);

  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0, 5], fov: 35, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[-3, 5, 6]} color="#fff4df" intensity={2.2} />
      <directionalLight position={[4, -2, 3]} color="#c2ab84" intensity={0.8} />
      <spotLight
        position={[0, 3.8, 4]}
        angle={0.38}
        penumbra={0.9}
        intensity={1.25}
        distance={9}
        decay={2}
        color="#fff0d4"
      />
      {films.map((film, index) => (
        <Roll key={film.id} film={film} index={index} activeStep={activeStep} onModelLoad={onModelLoad} />
      ))}
    </Canvas>
  );
}
