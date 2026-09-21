import { useEffect, useRef } from "react";
import { usePanelStore } from "../store/usePanelStore";
import BrainTransition from "./BrainTransition";
import GithubProjects from "./GithubProjects";
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

  return (
    <>
      {activePanel === "brain" && <BrainInterface />}
      <BrainTransition />
    </>
  );
}
