import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePanelStore } from "../store/usePanelStore";
import BrainTransition from "./BrainTransition";
import GithubProjects from "./GithubProjects";
import PhotographyInterface from "./PhotographyInterface";
import "./PanelContainer.css";

function BrainInterface() {
  const beginBrainExit = usePanelStore((state) => state.beginBrainExit);
  const brainTransitionPhase = usePanelStore(
    (state) => state.brainTransitionPhase,
  );
  const interfaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    interfaceRef.current?.focus({ preventScroll: true });

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        beginBrainExit();
      }

      if (event.key !== "Tab") return;
      const elements = [
        ...(interfaceRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex='0']",
        ) ?? []),
      ];
      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [beginBrainExit]);

  return (
    <section
      ref={interfaceRef}
      className={`neural-interface${brainTransitionPhase === "exiting" ? " neural-interface--exiting" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="neural-screen-title"
      tabIndex={-1}
    >
      <GithubProjects />
    </section>
  );
}

export default function PanelContainer() {
  const activePanel = usePanelStore((state) => state.activePanel);
  const reduceMotion = useReducedMotion();
  const syncPhotographyFromHistory = usePanelStore(
    (state) => state.syncPhotographyFromHistory,
  );

  useEffect(() => {
    window.addEventListener("popstate", syncPhotographyFromHistory);
    syncPhotographyFromHistory();
    return () => window.removeEventListener("popstate", syncPhotographyFromHistory);
  }, [syncPhotographyFromHistory]);

  return (
    <>
      {activePanel === "brain" && <BrainInterface />}
      <AnimatePresence initial={false}>
        {activePanel === "photography" && (
          <motion.div
            key="photography-panel"
            className="photography-panel-layer"
            initial={false}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
            exit={{
              opacity: 0,
              scale: 1.035,
              filter: "blur(12px) brightness(1.35)",
              pointerEvents: "none",
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.62,
              ease: [0.22, 0.8, 0.25, 1],
            }}
          >
            <PhotographyInterface />
          </motion.div>
        )}
      </AnimatePresence>
      <BrainTransition />
    </>
  );
}
