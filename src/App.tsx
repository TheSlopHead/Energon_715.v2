import { useCallback, useEffect, useState } from "react";
import TelegramBackdrop from "./scene/TelegramBackdrop";
import CrtOverlay from "./components/CrtOverlay";
import PanelContainer from "./components/PanelContainer";
import HeroIdentity from "./components/HeroIdentity";
import LoadingScreen from "./components/LoadingScreen";
import SceneAtmosphere from "./components/SceneAtmosphere";
import { MODEL_PATHS } from "./lib/modelAssets";

function App() {
  const [loadedModels, setLoadedModels] = useState<Set<string>>(() => new Set());
  const [sceneReady, setSceneReady] = useState(false);
  const [catReady, setCatReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const ready = sceneReady && catReady && loadedModels.size === MODEL_PATHS.length;
  const statsRequested = new URLSearchParams(window.location.search).get("stats") === "1";

  const markModelLoaded = useCallback((path: string) => {
    setLoadedModels((previous) => {
      if (previous.has(path)) return previous;
      const next = new Set(previous);
      next.add(path);
      return next;
    });
  }, []);

  const markSceneReady = useCallback(() => setSceneReady(true), []);
  const markCatReady = useCallback(() => setCatReady(true), []);

  useEffect(() => {
    if (!ready) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setShowLoadingScreen(false), reduceMotion ? 0 : 700);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <div inert={showLoadingScreen} aria-hidden={showLoadingScreen}>
        <TelegramBackdrop />
        <HeroIdentity
          onModelLoaded={markModelLoaded}
          onSceneReady={markSceneReady}
          showStats={!showLoadingScreen && statsRequested}
        />
        {!showLoadingScreen && <SceneAtmosphere />}
        <CrtOverlay />
        <PanelContainer />
      </div>
      {showLoadingScreen && (
        <LoadingScreen
          loadedModels={loadedModels.size + Number(catReady)}
          totalModels={MODEL_PATHS.length + 1}
          ready={ready}
          catReady={catReady}
          onCatReady={markCatReady}
        />
      )}
    </div>
  );
}

export default App;
