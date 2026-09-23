import { create } from "zustand";
import { fetchRepositories } from "../lib/github";
import type { Repository } from "../lib/github";

interface GithubState {
  repositories: Repository[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  loadedAt: number;
  load: () => Promise<void>;
}

export const useGithubStore = create<GithubState>((set, get) => ({
  repositories: [],
  status: "idle",
  error: null,
  loadedAt: 0,
  load: async () => {
    const state = get();
    if (state.status === "loading" || (state.status === "ready" && Date.now() - state.loadedAt < 300_000)) return;
    set({ status: "loading", error: null });
    try {
      const repositories = await fetchRepositories();
      set({ repositories, status: "ready", loadedAt: Date.now() });
    } catch (error) {
      const message = error instanceof Error && error.name === "Error"
        ? error.message
        : "Couldn't reach GitHub. Check your connection and try again.";
      set({ status: "error", error: message });
    }
  },
}));
