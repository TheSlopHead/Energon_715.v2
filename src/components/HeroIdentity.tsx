import { GITHUB_PROFILE } from "../lib/github";
import { usePanelStore } from "../store/usePanelStore";
import BustScene from "../scene/BustScene";
import "./HeroIdentity.css";

export default function HeroIdentity({ onModelLoaded, onSceneReady, showStats }: {
  onModelLoaded: (path: string) => void;
  onSceneReady: () => void;
  showStats: boolean;
}) {
  const brainActive = usePanelStore(
    (state) => state.brainTransitionPhase !== "idle" || state.activePanel === "brain",
  );

  return (
    <main className={`hero-layout${brainActive ? " hero-layout--brain-active" : ""}`}>
      <div className="hero-copy" inert={brainActive} aria-hidden={brainActive}>
        <section className="hero-identity" aria-labelledby="hero-name">
          <p className="hero-subject">SUBJECT / 0715</p>
          <h1 id="hero-name">ENERGON715</h1>
          <p className="hero-role">GO DEVELOPER / WEB EXPERIMENTS</p>
          <p className="hero-description">
            writing Go, building strange websites, shooting film and collecting
            noise.
          </p>
        </section>
        <nav className="hero-links" aria-label="Profile links">
          <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a
            href="https://t.me/dronizm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
        </nav>
      </div>
      <div className="hero-character" aria-label="Interactive 3D character">
        <BustScene onModelLoaded={onModelLoaded} onSceneReady={onSceneReady} showStats={showStats} />
      </div>
    </main>
  );
}
