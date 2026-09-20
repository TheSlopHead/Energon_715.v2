import { create } from "zustand";

type ActivePanel = "brain" | null;

interface PanelState {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  panelAnchor: { x: number; y: number };
  setPanelAnchor: (anchor: { x: number; y: number }) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  activePanel: null,
  setActivePanel: (activePanel) => set({ activePanel }),
  panelAnchor: { x: 0, y: 0 },
  setPanelAnchor: (panelAnchor) => set((state) =>
    Math.abs(state.panelAnchor.x - panelAnchor.x) < 0.5 &&
    Math.abs(state.panelAnchor.y - panelAnchor.y) < 0.5
      ? state
      : { panelAnchor }),
}));
