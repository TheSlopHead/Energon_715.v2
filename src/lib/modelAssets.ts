import { films } from "../../data/photos";

export const HERO_MODEL_PATH = "/Energon715.glb";

export const PROJECT_MODEL_PATHS: Record<string, string> = {
  dronizm: "/CRT-monitor.glb",
  "energon_715.v2": "/EnergonV2.glb",
  neurodronizm: "/NeuroDronizm.glb",
};

// Keep the loading screen in sync with every model the site actually uses.
export const MODEL_PATHS = [
  ...new Set([
    HERO_MODEL_PATH,
    ...Object.values(PROJECT_MODEL_PATHS),
    ...films.flatMap((film) => film.model ? [film.model] : []),
  ]),
];
