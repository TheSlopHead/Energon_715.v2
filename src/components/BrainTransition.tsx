import { useEffect } from "react";
import { usePanelStore } from "../store/usePanelStore";
import "./BrainTransition.css";

const BRAIN_TRANSITION_TIMING = {
  enterDuration: 1250,
  panelRevealDelay: 900,
  exitDuration: 1050,
} as const;

export default function BrainTransition() {
  const phase = usePanelStore((state) => state.brainTransitionPhase);
  const revealBrainPanel = usePanelStore((state) => state.revealBrainPanel);
  const completeBrainEnter = usePanelStore((state) => state.completeBrainEnter);
  const completeBrainExit = usePanelStore((state) => state.completeBrainExit);

  useEffect(() => {
    if (phase === "entering") {
      const revealTimer = window.setTimeout(
        revealBrainPanel,
        BRAIN_TRANSITION_TIMING.panelRevealDelay,
      );
      const completeTimer = window.setTimeout(
        completeBrainEnter,
        BRAIN_TRANSITION_TIMING.enterDuration,
      );
      return () => {
        window.clearTimeout(revealTimer);
        window.clearTimeout(completeTimer);
      };
    }

    if (phase === "exiting") {
      const completeTimer = window.setTimeout(
        completeBrainExit,
        BRAIN_TRANSITION_TIMING.exitDuration,
      );
      return () => window.clearTimeout(completeTimer);
    }
  }, [phase, revealBrainPanel, completeBrainEnter, completeBrainExit]);

  if (phase !== "entering" && phase !== "exiting") return null;

  const message =
    phase === "entering"
      ? "ACCESSING NEURAL MEMORY..."
      : "RETURNING TO EXTERNAL FEED...";

  return (
    <div
      key={phase}
      className={`brain-transition brain-transition--${phase}`}
      role="status"
      aria-live="polite"
    >
      <p className="brain-transition-message">
        <span aria-hidden="true">SYS / MEMORY</span>
        {message}
      </p>
    </div>
  );
}
