import { useState } from "react";
import { usePanelStore } from "../store/usePanelStore";
import AmbientParticles from "./AmbientParticles";
import "./SceneAtmosphere.css";

export default function SceneAtmosphere() {
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const activePanel = usePanelStore((state) => state.activePanel);
  const brainTransitionPhase = usePanelStore((state) => state.brainTransitionPhase);
  const beginBrainEnter = usePanelStore((state) => state.beginBrainEnter);
  const openPhotography = usePanelStore((state) => state.openPhotography);

  if (activePanel !== null || brainTransitionPhase !== "idle") return null;

  return (
    <div className="scene-atmosphere">
      <AmbientParticles variant="scene" enabled={particlesEnabled} />

      <div className="scene-atmosphere__corner scene-atmosphere__corner--top-left" aria-hidden="true" />
      <div className="scene-atmosphere__corner scene-atmosphere__corner--top-right" aria-hidden="true" />
      <div className="scene-atmosphere__corner scene-atmosphere__corner--bottom-left" aria-hidden="true" />
      <div className="scene-atmosphere__corner scene-atmosphere__corner--bottom-right" aria-hidden="true" />

      <p className="scene-atmosphere__caption" aria-hidden="true">
        <span className="scene-atmosphere__pulse" /> LIVE / EXPLORE THE SUBJECT
      </p>

      <nav className="scene-atmosphere__controls" aria-label="Explore the portfolio">
        <p>SELECT A MEMORY <span>↘</span></p>
        <button type="button" onClick={beginBrainEnter} aria-label="Explore code and projects">
          <span className="scene-atmosphere__index">01</span>
          <span className="scene-atmosphere__control-copy">
            <strong>BRAIN</strong>
            <small>CODE / PROJECTS</small>
          </span>
          <span className="scene-atmosphere__arrow" aria-hidden="true">↗</span>
        </button>
        <button type="button" onClick={openPhotography} aria-label="Explore film photography">
          <span className="scene-atmosphere__index">02</span>
          <span className="scene-atmosphere__control-copy">
            <strong>CAMERA</strong>
            <small>FILM PHOTOGRAPHY</small>
          </span>
          <span className="scene-atmosphere__arrow" aria-hidden="true">↗</span>
        </button>
      </nav>

      <button
        className="scene-atmosphere__toggle"
        type="button"
        aria-pressed={particlesEnabled}
        onClick={() => setParticlesEnabled((current) => !current)}
      >
        <span className="scene-atmosphere__toggle-light" aria-hidden="true" />
        PARTICLES {particlesEnabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}
