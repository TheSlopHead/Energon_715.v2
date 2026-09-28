import { create } from "zustand";

type ActivePanel = "brain" | "photography" | "music" | "thanks" | null;
export type BrainTransitionPhase = "idle" | "entering" | "open" | "exiting";

const PHOTOGRAPHY_HISTORY_KEY = "__energonPhotography";
const MUSIC_HISTORY_KEY = "__energonMusic";
const THANKS_HISTORY_KEY = "__energonThanks";

function isPhotographyUrl() {
  return new URL(window.location.href).searchParams.get("section") === "photography";
}

function isMusicUrl() {
  return new URL(window.location.href).searchParams.get("section") === "music";
}

function isThanksUrl() {
  return new URL(window.location.href).searchParams.get("section") === "thanks";
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
  openMusic: () => void;
  closeMusic: () => void;
  openThanks: () => void;
  closeThanks: () => void;
  syncPanelsFromHistory: () => void;
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
  openMusic: () => {
    const state = get();
    if (state.brainTransitionPhase !== "idle" || state.activePanel !== null) return;

    const url = new URL(window.location.href);
    url.searchParams.set("section", "music");
    const currentHistoryState = window.history.state;
    window.history.pushState(
      {
        ...(currentHistoryState && typeof currentHistoryState === "object"
          ? currentHistoryState
          : {}),
        [MUSIC_HISTORY_KEY]: true,
      },
      "",
      url,
    );
    set({ activePanel: "music" });
  },
  closeMusic: () => {
    if (get().activePanel !== "music") return;
    set({ activePanel: null });

    if (window.history.state?.[MUSIC_HISTORY_KEY]) {
      window.history.back();
    } else if (isMusicUrl()) {
      const url = new URL(window.location.href);
      url.searchParams.delete("section");
      window.history.replaceState(window.history.state, "", url);
    }
  },
  openThanks: () => {
    const state = get();
    if (state.brainTransitionPhase !== "idle" || state.activePanel !== null) return;

    const url = new URL(window.location.href);
    url.searchParams.set("section", "thanks");
    const currentHistoryState = window.history.state;
    window.history.pushState(
      {
        ...(currentHistoryState && typeof currentHistoryState === "object"
          ? currentHistoryState
          : {}),
        [THANKS_HISTORY_KEY]: true,
      },
      "",
      url,
    );
    set({ activePanel: "thanks" });
  },
  closeThanks: () => {
    if (get().activePanel !== "thanks") return;
    set({ activePanel: null });

    if (window.history.state?.[THANKS_HISTORY_KEY]) {
      window.history.back();
    } else if (isThanksUrl()) {
      const url = new URL(window.location.href);
      url.searchParams.delete("section");
      window.history.replaceState(window.history.state, "", url);
    }
  },
  syncPanelsFromHistory: () =>
    set((state) => {
      if (state.brainTransitionPhase !== "idle" || state.activePanel === "brain") return state;
      if (isPhotographyUrl()) {
        return { activePanel: "photography", photographyEnteredByCamera: false };
      }
      if (isMusicUrl()) {
        return { activePanel: "music", photographyEnteredByCamera: false };
      }
      if (isThanksUrl()) {
        return { activePanel: "thanks", photographyEnteredByCamera: false };
      }
      return state.activePanel === "photography" || state.activePanel === "music" || state.activePanel === "thanks"
        ? { activePanel: null, photographyEnteredByCamera: false }
        : state;
    }),
}));
