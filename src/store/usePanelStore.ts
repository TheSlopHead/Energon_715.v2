import { create } from "zustand";

type ActivePanel = "brain" | "photography" | null;
export type BrainTransitionPhase = "idle" | "entering" | "open" | "exiting";

const PHOTOGRAPHY_HISTORY_KEY = "__energonPhotography";

function isPhotographyUrl() {
  return new URL(window.location.href).searchParams.get("section") === "photography";
}

interface PanelState {
  activePanel: ActivePanel;
  photographyEnteredByCamera: boolean;
  setActivePanel: (panel: ActivePanel) => void;
  brainTransitionPhase: BrainTransitionPhase;
  beginBrainEnter: () => void;
  revealBrainPanel: () => void;
  completeBrainEnter: () => void;
  beginBrainExit: () => void;
  completeBrainExit: () => void;
  openPhotography: () => void;
  closePhotography: () => void;
  syncPhotographyFromHistory: () => void;
}

export const usePanelStore = create<PanelState>((set, get) => ({
  activePanel: null,
  photographyEnteredByCamera: false,
  setActivePanel: (activePanel) => set({ activePanel }),
  brainTransitionPhase: "idle",
  beginBrainEnter: () =>
    set((state) =>
      state.brainTransitionPhase === "idle" && state.activePanel === null
        ? { activePanel: null, brainTransitionPhase: "entering" }
        : state,
    ),
  revealBrainPanel: () =>
    set((state) =>
      state.brainTransitionPhase === "entering"
        ? { activePanel: "brain" }
        : state,
    ),
  completeBrainEnter: () =>
    set((state) =>
      state.brainTransitionPhase === "entering"
        ? { brainTransitionPhase: "open" }
        : state,
    ),
  beginBrainExit: () =>
    set((state) =>
      state.brainTransitionPhase === "open" || state.activePanel === "brain"
        ? { brainTransitionPhase: "exiting" }
        : state,
    ),
  completeBrainExit: () =>
    set((state) =>
      state.brainTransitionPhase === "exiting"
        ? { activePanel: null, brainTransitionPhase: "idle" }
        : state,
    ),
  openPhotography: () => {
    const state = get();
    if (state.brainTransitionPhase !== "idle" || state.activePanel !== null) return;

    const url = new URL(window.location.href);
    url.searchParams.set("section", "photography");
    const currentHistoryState = window.history.state;
    window.history.pushState(
      {
        ...(currentHistoryState && typeof currentHistoryState === "object"
          ? currentHistoryState
          : {}),
        [PHOTOGRAPHY_HISTORY_KEY]: true,
      },
      "",
      url,
    );
    set({ activePanel: "photography", photographyEnteredByCamera: true });
  },
  closePhotography: () => {
    if (get().activePanel !== "photography") return;
    set({ activePanel: null, photographyEnteredByCamera: false });

    if (window.history.state?.[PHOTOGRAPHY_HISTORY_KEY]) {
      window.history.back();
    } else if (isPhotographyUrl()) {
      const url = new URL(window.location.href);
      url.searchParams.delete("section");
      window.history.replaceState(window.history.state, "", url);
    }
  },
  syncPhotographyFromHistory: () =>
    set((state) => {
      if (isPhotographyUrl()) {
        return state.brainTransitionPhase === "idle" && state.activePanel === null
          ? { activePanel: "photography", photographyEnteredByCamera: false }
          : state;
      }
      return state.activePanel === "photography"
        ? { activePanel: null, photographyEnteredByCamera: false }
        : state;
    }),
}));
