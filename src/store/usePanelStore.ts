import { create } from "zustand";

type ActivePanel = "brain" | null;
export type BrainTransitionPhase = "idle" | "entering" | "open" | "exiting";

interface PanelState {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  brainTransitionPhase: BrainTransitionPhase;
  beginBrainEnter: () => void;
  revealBrainPanel: () => void;
  completeBrainEnter: () => void;
  beginBrainExit: () => void;
  completeBrainExit: () => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  activePanel: null,
  setActivePanel: (activePanel) => set({ activePanel }),
  brainTransitionPhase: "idle",
  beginBrainEnter: () =>
    set((state) =>
      state.brainTransitionPhase === "idle"
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
}));
