import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Stats } from "@react-three/drei";
import * as THREE from "three";
import { usePanelStore } from "../store/usePanelStore";
import { HERO_MODEL_PATH, MODEL_PATHS } from "../lib/modelAssets";

const CHARACTER_LIGHTING = {
  ambientIntensity: 0.22,
  hemisphere: {
    skyColor: "#f1f4f6",
    groundColor: "#68727a",
    intensity: 0.62,
  },
  key: {
    color: "#fffaf3",
    position: [-4, 5, 4] as [number, number, number],
    intensity: 3,
  },
  fill: {
    color: "#c7d4de",
    position: [4, 1.5, 2.5] as [number, number, number],
    intensity: 1.5,
  },
  rim: {
    color: "#d7e3ea",
    position: [1.5, 3.5, -4] as [number, number, number],
    intensity: 12,
  },
  environmentIntensity: 0.34,
};

const CHARACTER_MATERIAL_BRIGHTNESS = {
  colorLift: 0.06,
  texturedEmissiveIntensity: 0.08,
};

const CAMERA_HOVER_LIGHT = {
  color: new THREE.Color("#e4e6df"),
  colorBlend: 0.32,
  intensityLift: 0.12,
};

const HERO_CAMERA = {
  distance: 3,
  fov: 50,
} as const;

const BRAIN_GLOW = {
  color: new THREE.Color("#cf7299"),
  speed: 0.62,
  idleIntensity: [0.12, 0.18] as const,
  hoverIntensity: [0.4, 0.26] as const,
  hoverResponse: 6,
};

function Model({
  onBrainHover,
  onCameraHover,
}: {
  onBrainHover: (hovered: boolean) => void;
  onCameraHover: (hovered: boolean) => void;
}) {
  const beginBrainEnter = usePanelStore((state) => state.beginBrainEnter);
  const openPhotography = usePanelStore((state) => state.openPhotography);
  const { scene: source } = useGLTF(HERO_MODEL_PATH);
  const viewportWidth = useThree((state) => state.size.width);
  const viewportHeight = useThree((state) => state.size.height);
  const aspect = viewportWidth / viewportHeight;
  const visibleSceneWidth =
    2 *
    HERO_CAMERA.distance *
    Math.tan(THREE.MathUtils.degToRad(HERO_CAMERA.fov / 2)) *
    aspect;
  const compactLayout = viewportWidth <= 700;
  const heroOffset = visibleSceneWidth * (compactLayout ? 0.1 : 0.15);
  const heroScale = compactLayout
    ? THREE.MathUtils.clamp(0.58 + (viewportWidth - 390) * 0.0007, 0.56, 0.8)
    : THREE.MathUtils.clamp(0.68 + (viewportWidth - 360) * 0.00065, 0.8, 1.05);
  const heroHeight = compactLayout ? 0.1 : 0.13;
  const groupRef = useRef<THREE.Group>(null);
  const brainHoveredRef = useRef(false);
  const cameraHoveredRef = useRef(false);
  const cameraHighlightRef = useRef(false);
  const brainHoverBlendRef = useRef(0);
  const rotationSpeedRef = useRef(1);
  const cameraMotionRef = useRef(1);

  const model = useMemo(() => {
    const scene = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    scene.scale.multiplyScalar(2 / bounds.getSize(new THREE.Vector3()).y);
    bounds.setFromObject(scene);
    scene.position.sub(bounds.getCenter(new THREE.Vector3()));
    scene.updateMatrixWorld(true);

    const brainBounds = new THREE.Box3();
    const camera = scene.getObjectByName("camera");
    const cameraBounds = camera
      ? new THREE.Box3().setFromObject(camera)
      : new THREE.Box3();
    const characterMaterials: THREE.Material[] = [];
    const brainMaterials: THREE.MeshStandardMaterial[] = [];
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      // A simple brain hit area avoids raycasting the dense scanned geometry.
      object.raycast = () => {};
      const isBrain = object.name.startsWith("Brain_Part_");
      if (isBrain) brainBounds.union(new THREE.Box3().setFromObject(object));
      const brighten = (material: THREE.Material) => {
        const copy = material.clone();
        characterMaterials.push(copy);
        if (copy instanceof THREE.MeshStandardMaterial) {
          copy.color.lerp(
            new THREE.Color("#ffffff"),
            CHARACTER_MATERIAL_BRIGHTNESS.colorLift,
          );
          if (copy.map) {
            copy.emissive.set("#ffffff");
            copy.emissiveMap = copy.map;
            copy.emissiveIntensity =
              CHARACTER_MATERIAL_BRIGHTNESS.texturedEmissiveIntensity;
          }
          if (isBrain) brainMaterials.push(copy);
        }
        return copy;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(brighten)
        : brighten(object.material);
    });

    const cameraMaterials: {
      material: THREE.MeshStandardMaterial;
      idleEmissive: THREE.Color;
      hoverEmissive: THREE.Color;
      idleIntensity: number;
    }[] = [];
    camera?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        const idleEmissive = material.emissive.clone();
        cameraMaterials.push({
          material,
          idleEmissive,
          hoverEmissive: idleEmissive
            .clone()
            .lerp(CAMERA_HOVER_LIGHT.color, CAMERA_HOVER_LIGHT.colorBlend),
          idleIntensity: material.emissiveIntensity,
        });
      }
    });

    return {
      scene,
      characterMaterials,
      brainBounds,
      brainCenter: brainBounds.getCenter(new THREE.Vector3()),
      brainSize: brainBounds.getSize(new THREE.Vector3()).multiplyScalar(0.55),
      brainMaterials,
      camera,
      cameraMaterials,
      cameraCenter: cameraBounds.getCenter(new THREE.Vector3()),
      cameraSize: cameraBounds.getSize(new THREE.Vector3()).multiplyScalar(1.3),
      cdPlayer: scene.getObjectByName("cdplayer"),
    };
  }, [source]);

  const animatedModelRef = useRef<typeof model | null>(null);
  useEffect(() => {
    animatedModelRef.current = model;
    return () => {
      animatedModelRef.current = null;
      model.characterMaterials.forEach((material) => material.dispose());
    };
  }, [model]);

  const cameraTransitionRef = useRef({
    initialized: false,
    blend: 0,
    originalPosition: new THREE.Vector3(),
    originalQuaternion: new THREE.Quaternion(),
    brainWorld: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    targetQuaternion: new THREE.Quaternion(),
    lookMatrix: new THREE.Matrix4(),
  });

  useFrame(({ camera, clock }, delta) => {
    const group = groupRef.current;
    const model = animatedModelRef.current;
    if (!group || !model) return;
    const cameraTransition = cameraTransitionRef.current;
    const { activePanel, brainTransitionPhase } = usePanelStore.getState();
    const memoryActive = brainTransitionPhase !== "idle";
    const cameraMotionTarget = cameraHoveredRef.current ? 0 : 1;
    cameraMotionRef.current = THREE.MathUtils.damp(
      cameraMotionRef.current,
      cameraMotionTarget,
      3.5,
      delta,
    );
    if (Math.abs(cameraMotionRef.current - cameraMotionTarget) < 0.001) {
      cameraMotionRef.current = cameraMotionTarget;
    }

    if (activePanel !== null || memoryActive) {
      rotationSpeedRef.current = 0;
    } else {
      const targetSpeed = brainHoveredRef.current ? 0 : 1;
      // Exponential damping stays stable even when a frame takes a long time.
      rotationSpeedRef.current = THREE.MathUtils.damp(
        rotationSpeedRef.current,
        targetSpeed,
        6,
        delta,
      );
      if (Math.abs(rotationSpeedRef.current - targetSpeed) < 0.001) {
        rotationSpeedRef.current = targetSpeed;
      }
      // Bound long frames so background tabs and slow GPUs cannot cause jumps.
      const step =
        Math.min(delta, 0.1) *
        rotationSpeedRef.current *
        cameraMotionRef.current;
      group.rotation.y += 0.4 * step;
      if (model.camera) model.camera.rotation.z += step;
      if (model.cdPlayer) model.cdPlayer.rotation.z += step;
    }

    if (cameraHighlightRef.current !== cameraHoveredRef.current) {
      cameraHighlightRef.current = cameraHoveredRef.current;
      for (const {
        material,
        idleEmissive,
        hoverEmissive,
        idleIntensity,
      } of model.cameraMaterials) {
        material.setValues({
          emissive: cameraHoveredRef.current ? hoverEmissive : idleEmissive,
          emissiveIntensity:
            idleIntensity +
            (cameraHoveredRef.current ? CAMERA_HOVER_LIGHT.intensityLift : 0),
        });
      }
    }

    if (!cameraTransition.initialized) {
      cameraTransition.originalPosition.copy(camera.position);
      cameraTransition.originalQuaternion.copy(camera.quaternion);
      cameraTransition.initialized = true;
    }

    const cameraTarget =
      brainTransitionPhase === "entering" || brainTransitionPhase === "open"
        ? 1
        : 0;
    if (brainTransitionPhase === "open") cameraTransition.blend = 1;
    else if (brainTransitionPhase === "idle") cameraTransition.blend = 0;
    else {
      cameraTransition.blend = THREE.MathUtils.damp(
        cameraTransition.blend,
        cameraTarget,
        6,
        delta,
      );
    }

    group.updateWorldMatrix(true, false);
    cameraTransition.brainWorld.copy(model.brainCenter);
    group.localToWorld(cameraTransition.brainWorld);
    cameraTransition.direction
      .copy(cameraTransition.originalPosition)
      .sub(cameraTransition.brainWorld)
      .normalize();
    cameraTransition.targetPosition
      .copy(cameraTransition.brainWorld)
      .addScaledVector(cameraTransition.direction, 0.72);
    cameraTransition.lookMatrix.lookAt(
      cameraTransition.targetPosition,
      cameraTransition.brainWorld,
      camera.up,
    );
    cameraTransition.targetQuaternion.setFromRotationMatrix(
      cameraTransition.lookMatrix,
    );
    camera.position.lerpVectors(
      cameraTransition.originalPosition,
      cameraTransition.targetPosition,
      cameraTransition.blend,
    );
    camera.quaternion.slerpQuaternions(
      cameraTransition.originalQuaternion,
      cameraTransition.targetQuaternion,
      cameraTransition.blend,
    );

    brainHoverBlendRef.current = THREE.MathUtils.damp(
      brainHoverBlendRef.current,
      brainHoveredRef.current ? 1 : 0,
      BRAIN_GLOW.hoverResponse,
      delta,
    );
    const pulse = (Math.sin(clock.elapsedTime * BRAIN_GLOW.speed) + 1) / 2;
    const idleGlow = THREE.MathUtils.lerp(...BRAIN_GLOW.idleIntensity, pulse);
    const hoverGlow = THREE.MathUtils.lerp(...BRAIN_GLOW.hoverIntensity, pulse);
    const glowIntensity = THREE.MathUtils.lerp(
      idleGlow,
      hoverGlow,
      brainHoverBlendRef.current,
    );

    for (const material of model.brainMaterials) {
      material.setValues({
        emissive: BRAIN_GLOW.color,
        emissiveIntensity: glowIntensity,
      });
    }
  });

  const setBrainHovered = (hovered: boolean) => {
    brainHoveredRef.current = hovered;
    onBrainHover(hovered);
  };

  const setCameraHovered = (hovered: boolean) => {
    cameraHoveredRef.current = hovered;
    onCameraHover(hovered);
  };

  return (
    <group
      ref={groupRef}
      position={[heroOffset, heroHeight, 0]}
      scale={heroScale}
    >
      <primitive object={model.scene} />
      <mesh
        name="brain-hit-area"
        position={model.brainCenter}
        scale={model.brainSize}
        visible={false}
        onPointerOver={() => {
          setBrainHovered(true);
        }}
        onPointerOut={() => {
          setBrainHovered(false);
        }}
        onClick={() => {
          setBrainHovered(false);
          beginBrainEnter();
        }}
      >
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      {model.camera && (
        <mesh
          name="camera-hit-area"
          position={model.cameraCenter}
          scale={model.cameraSize}
          visible={false}
          onPointerOver={() => setCameraHovered(true)}
          onPointerOut={() => setCameraHovered(false)}
          onClick={() => {
            setCameraHovered(false);
            openPhotography();
          }}
        >
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      )}
    </group>
  );
}

function TrackModel({ path, onLoaded }: {
  path: string;
  onLoaded: (path: string) => void;
}) {
  useGLTF(path);

  useEffect(() => {
    onLoaded(path);
  }, [onLoaded, path]);

  return null;
}

function SceneReady({ onReady }: { onReady: () => void }) {
  const signaled = useRef(false);

  useFrame(() => {
    if (signaled.current) return;
    signaled.current = true;
    onReady();
  });

  return null;
}

export default function BustScene({ onModelLoaded, onSceneReady, showStats }: {
  onModelLoaded: (path: string) => void;
  onSceneReady: () => void;
  showStats: boolean;
}) {
  const activePanel = usePanelStore((state) => state.activePanel);
  const [brainHovered, setBrainHovered] = useState(false);
  const [cameraHovered, setCameraHovered] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
        position: "relative",
        zIndex: 2,
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, HERO_CAMERA.distance],
          fov: HERO_CAMERA.fov,
        }}
        gl={{ alpha: true, toneMappingExposure: 1.5 }}
        style={{
          background: "transparent",
          cursor: brainHovered || cameraHovered ? "pointer" : "default",
        }}
      >
        {activePanel === null && showStats && <Stats />}
        <ambientLight intensity={CHARACTER_LIGHTING.ambientIntensity} />
        <hemisphereLight
          color={CHARACTER_LIGHTING.hemisphere.skyColor}
          groundColor={CHARACTER_LIGHTING.hemisphere.groundColor}
          intensity={CHARACTER_LIGHTING.hemisphere.intensity}
        />
        <directionalLight
          name="character-key-light"
          color={CHARACTER_LIGHTING.key.color}
          position={CHARACTER_LIGHTING.key.position}
          intensity={CHARACTER_LIGHTING.key.intensity}
        />
        <directionalLight
          name="character-fill-light"
          color={CHARACTER_LIGHTING.fill.color}
          position={CHARACTER_LIGHTING.fill.position}
          intensity={CHARACTER_LIGHTING.fill.intensity}
        />
        <directionalLight
          name="character-rim-light"
          color={CHARACTER_LIGHTING.rim.color}
          position={CHARACTER_LIGHTING.rim.position}
          intensity={CHARACTER_LIGHTING.rim.intensity}
        />
        {MODEL_PATHS.map((path) => (
          <Suspense key={path} fallback={null}>
            <TrackModel path={path} onLoaded={onModelLoaded} />
          </Suspense>
        ))}
        <Suspense fallback={null}>
          <Environment
            preset="city"
            environmentIntensity={CHARACTER_LIGHTING.environmentIntensity}
          />
          <Model
            onBrainHover={setBrainHovered}
            onCameraHover={setCameraHovered}
          />
          <SceneReady onReady={onSceneReady} />
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
