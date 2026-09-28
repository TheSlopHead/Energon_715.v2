import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { usePanelStore } from "../store/usePanelStore";
import ThanksCharacterModel from "./ThanksCharacterModel";
import "./ThanksInterface.css";

export default function ThanksInterface() {
  const closeThanks = usePanelStore((state) => state.closeThanks);
  const reduceMotion = Boolean(useReducedMotion());
  const interfaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    interfaceRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeThanks();
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...(interfaceRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]") ?? []),
      ];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === interfaceRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, [closeThanks]);

  return (
    <section
      ref={interfaceRef}
      className="thanks-interface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thanks-title"
      tabIndex={-1}
    >
      <div className="thanks-interface__grain" aria-hidden="true" />

      <div className="thanks-copy">
        <h1 id="thanks-title">THANK YOU,<br /><span>MIMICODE66 —</span></h1>
        <p>for the 3D model<br />and for your help<br />&lt;3</p>
      </div>

      <div className="thanks-actions">
        <button type="button" onClick={closeThanks} aria-label="Return to character">
          <span aria-hidden="true">↖</span> RETURN
        </button>
        <a href="https://github.com/mimicode666" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 19 19" aria-hidden="true"><use href="/icons.svg#github-icon" /></svg>
          GITHUB <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="thanks-stage" role="img" aria-label="Rotating 3D character by mimicode66">
        <div className="thanks-stage__orbit" aria-hidden="true" />
        <div className="thanks-stage__shadow" aria-hidden="true" />
        <span className="thanks-stage__star thanks-stage__star--one" aria-hidden="true" />
        <span className="thanks-stage__star thanks-stage__star--two" aria-hidden="true" />
        <span className="thanks-stage__star thanks-stage__star--three" aria-hidden="true" />
        <div className="thanks-stage__model">
          <Canvas
            camera={{ position: [0, 0, 4.7], fov: 36 }}
            gl={{ alpha: true, antialias: true, toneMappingExposure: 1.1 }}
            dpr={[1, 1.8]}
            style={{ background: "transparent", pointerEvents: "none" }}
          >
            <ambientLight intensity={1.35} color="#f8ffe9" />
            <hemisphereLight args={["#fffceb", "#7b9869", 1]} />
            <directionalLight position={[-3, 4, 5]} intensity={2.3} color="#fffde9" />
            <directionalLight position={[4, 1, -3]} intensity={1.2} color="#d2ecb3" />
            <Suspense fallback={null}>
              <ThanksCharacterModel rotate reduceMotion={reduceMotion} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      <div className="thanks-footer">
        <span className="thanks-footer__slash">/</span>
        <span>SPECIAL THANKS</span>
        <span>2026</span>
      </div>
    </section>
  );
}
