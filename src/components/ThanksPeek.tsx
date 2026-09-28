import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { usePanelStore } from "../store/usePanelStore";
import ThanksCharacterModel from "./ThanksCharacterModel";
import "./ThanksPeek.css";

export default function ThanksPeek() {
  const openThanks = usePanelStore((state) => state.openThanks);
  const [visible, setVisible] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const interactingRef = useRef(false);

  useEffect(() => {
    let timer = 0;

    const hide = () => {
      if (interactingRef.current) {
        timer = window.setTimeout(hide, 1000);
        return;
      }
      setVisible(false);
      schedule(false);
    };

    const schedule = (first: boolean) => {
      const delay = first ? 5000 + Math.random() * 4000 : 19000 + Math.random() * 13000;
      timer = window.setTimeout(() => {
        setHasAppeared(true);
        setVisible(true);
        timer = window.setTimeout(hide, 6500);
      }, delay);
    };

    schedule(true);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <button
      type="button"
      className={`thanks-peek${visible ? " thanks-peek--visible" : ""}`}
      aria-label="Open special thanks to mimicode66"
      aria-hidden={!visible}
      inert={!visible}
      tabIndex={visible ? 0 : -1}
      onPointerEnter={() => { interactingRef.current = true; }}
      onPointerLeave={() => { interactingRef.current = false; }}
      onFocus={() => { interactingRef.current = true; }}
      onBlur={() => { interactingRef.current = false; }}
      onClick={openThanks}
    >
      {hasAppeared && (
        <Canvas
          frameloop="demand"
          camera={{ position: [0, 0, 4.7], fov: 40 }}
          gl={{ alpha: true, antialias: true, toneMappingExposure: 1.1 }}
          dpr={[1, 1.5]}
          className="thanks-peek__canvas"
          style={{ background: "transparent", pointerEvents: "none" }}
        >
          <ambientLight intensity={1.5} color="#ffffff" />
          <hemisphereLight args={["#fff8ee", "#8895aa", 0.85]} />
          <directionalLight position={[-3, 4, 5]} intensity={2.2} color="#fff4e9" />
          <Suspense fallback={null}>
            <ThanksCharacterModel />
          </Suspense>
        </Canvas>
      )}
    </button>
  );
}
