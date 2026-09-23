import { useProgress } from "@react-three/drei";
import AmbientParticles from "./AmbientParticles";
import LoadingCat from "./LoadingCat";
import "./LoadingScreen.css";

export default function LoadingScreen({ loadedModels, totalModels, ready, catReady, onCatReady }: {
  loadedModels: number;
  totalModels: number;
  ready: boolean;
  catReady: boolean;
  onCatReady: () => void;
}) {
  const { progress, errors } = useProgress();
  const prepared = totalModels > 0 ? loadedModels / totalModels : 1;
  const percentage = ready
    ? 100
    : Math.min(96, Math.max(Math.round(prepared * 90), Math.round(progress * 0.82)));
  const failed = errors.length > 0;

  return (
    <div className={`loading-screen${ready ? " loading-screen--leaving" : ""}`} aria-hidden={ready}>
      <div className="loading-screen__glow" aria-hidden="true" />
      <div className="loading-screen__grid" aria-hidden="true" />
      <div className="loading-screen__beams" aria-hidden="true">
        <span /><span /><span />
      </div>
      <AmbientParticles variant="loading" />

      <div className="loading-screen__corner loading-screen__corner--left" aria-hidden="true">
        <span>ENERGON715</span>
        <span>INITIALIZING / 001</span>
      </div>
      <div className="loading-screen__corner loading-screen__corner--right" aria-hidden="true">
        <span>PERSONAL ARCHIVE</span>
        <span>EST. 2026</span>
      </div>

      <div className="loading-screen__composition">
        <div className="loading-screen__stage" aria-hidden="true">
          <div className="loading-screen__orbit loading-screen__orbit--outer" />
          <div className="loading-screen__orbit loading-screen__orbit--inner" />
          <div className="loading-screen__model-slot">
            <img
              className={`loading-screen__cat-poster${catReady ? " loading-screen__cat-poster--hidden" : ""}`}
              src="/Yuda_cat_poster.webp"
              alt=""
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
            <LoadingCat onReady={onCatReady} />
          </div>
          <div className="loading-screen__shadow" />
        </div>

        <div className="loading-screen__status" role="status" aria-live="polite">
          <p className="loading-screen__eyebrow">SCENE / {String(totalModels).padStart(2, "0")} ASSETS</p>
          <h2>{failed ? "LOAD ERROR" : ready ? "READY" : "LOADING..."}</h2>
          <p className="loading-screen__detail">
            {failed ? "A scene asset could not be loaded." : ready ? "ENTERING ARCHIVE" : "PREPARING THE WORLD"}
          </p>
          <div className="loading-screen__meter-row">
            <div
              className="loading-screen__meter"
              role="progressbar"
              aria-label="3D model loading progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
            >
              <span style={{ width: `${percentage}%` }} />
            </div>
            <span className="loading-screen__percentage">{String(percentage).padStart(2, "0")}%</span>
          </div>
          <div className="loading-screen__underbar">
            <span>{String(loadedModels).padStart(2, "0")} / {String(totalModels).padStart(2, "0")} MODELS</span>
            <span>{failed ? "CONNECTION INTERRUPTED" : "PLEASE WAIT"}</span>
          </div>
          {failed && (
            <button className="loading-screen__retry" onClick={() => window.location.reload()}>
              RETRY LOADING
            </button>
          )}
        </div>
      </div>

      <div className="loading-screen__footer" aria-hidden="true">
        <span>DO NOT DISCONNECT</span>
        <span>◈ &nbsp; THE MEMORY IS FORMING</span>
        <span>© ENERGON715</span>
      </div>
    </div>
  );
}
