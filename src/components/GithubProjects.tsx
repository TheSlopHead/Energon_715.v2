import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchRepositoryCommits, GITHUB_PROFILE } from "../lib/github";
import type { RepositoryCommit } from "../lib/github";
import { useGithubStore } from "../store/useGithubStore";
import { usePanelStore } from "../store/usePanelStore";
import ProjectModelPreview from "./ProjectModelPreview";

const MEMORY_SLOT_COUNT = 6;
const PROJECT_MODEL_PATHS: Record<string, string> = {
  dronizm: "/CRT-monitor.glb",
  "energon_715.v2": "/EnergonV2.glb",
  neurodronizm: "/NeuroDronizm.glb",
};
const commitCache = new Map<string, RepositoryCommit[]>();

const dateFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface HistoryState {
  repository: string | null;
  status: "idle" | "loading" | "ready" | "error";
  commits: RepositoryCommit[];
  error: string | null;
}

const EMPTY_HISTORY: HistoryState = {
  repository: null,
  status: "idle",
  commits: [],
  error: null,
};

function getCarouselOffset(index: number, selectedIndex: number) {
  let offset = (index - selectedIndex + MEMORY_SLOT_COUNT) % MEMORY_SLOT_COUNT;
  if (offset > MEMORY_SLOT_COUNT / 2) offset -= MEMORY_SLOT_COUNT;
  return offset;
}

export default function GithubProjects() {
  const { repositories, status, error, load } = useGithubStore();
  const beginBrainExit = usePanelStore((state) => state.beginBrainExit);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryState>(EMPTY_HISTORY);
  const historyRequest = useRef(0);

  useEffect(() => {
    void load();
  }, [load]);

  const projects = useMemo(
    () => repositories.slice(0, MEMORY_SLOT_COUNT),
    [repositories],
  );
  const requestedIndex = projects.findIndex(
    (project) => project.id === selectedId,
  );
  const selectedIndex = requestedIndex >= 0 ? requestedIndex : 0;
  const selected = projects[selectedIndex];
  const historyVisible = history.repository === selected?.name;
  const slots = Array.from(
    { length: MEMORY_SLOT_COUNT },
    (_, index) => projects[index] ?? null,
  );

  const hideHistory = useCallback(() => {
    historyRequest.current += 1;
    setHistory(EMPTY_HISTORY);
  }, []);

  const selectRelative = useCallback(
    (direction: -1 | 1) => {
      if (!projects.length) return;
      const nextIndex =
        (selectedIndex + direction + projects.length) % projects.length;
      setSelectedId(projects[nextIndex].id);
      hideHistory();
    },
    [hideHistory, projects, selectedIndex],
  );

  const toggleHistory = useCallback(async () => {
    if (!selected) return;
    if (history.repository === selected.name) {
      hideHistory();
      return;
    }

    const requestId = historyRequest.current + 1;
    historyRequest.current = requestId;
    const cached = commitCache.get(selected.name);
    if (cached) {
      setHistory({
        repository: selected.name,
        status: "ready",
        commits: cached,
        error: null,
      });
      return;
    }

    setHistory({
      repository: selected.name,
      status: "loading",
      commits: [],
      error: null,
    });
    try {
      const commits = await fetchRepositoryCommits(selected.name);
      if (historyRequest.current !== requestId) return;
      commitCache.set(selected.name, commits);
      setHistory({
        repository: selected.name,
        status: "ready",
        commits,
        error: null,
      });
    } catch (historyError) {
      if (historyRequest.current !== requestId) return;
      setHistory({
        repository: selected.name,
        status: "error",
        commits: [],
        error:
          historyError instanceof Error
            ? historyError.message
            : "Couldn't load this project's commit history.",
      });
    }
  }, [hideHistory, history.repository, selected]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        selectRelative(event.key === "ArrowLeft" ? -1 : 1);
        return;
      }

      if (event.repeat) return;
      if (event.key.toLowerCase() === "x" && selected) {
        event.preventDefault();
        window.open(selected.html_url, "_blank", "noopener,noreferrer");
      } else if (event.key.toLowerCase() === "h" && selected) {
        event.preventDefault();
        void toggleHistory();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [selectRelative, selected, toggleHistory]);

  const loading = status === "idle" || status === "loading";
  const currentNumber = selected ? selectedIndex + 1 : 1;

  return (
    <>
      <header className="neural-header">
        <h1 id="neural-screen-title">NEURAL STORAGE / PROJECT MEMORY</h1>
        <span className="neural-counter" aria-live="polite">
          {String(currentNumber).padStart(2, "0")} /{" "}
          {String(MEMORY_SLOT_COUNT).padStart(2, "0")}
        </span>
      </header>

      <main className="neural-object-browser" aria-busy={loading}>
        {slots.map((project, index) => {
          const offset = getCarouselOffset(index, selectedIndex);
          const offsetName = offset < 0 ? `neg-${Math.abs(offset)}` : offset;
          const className = `neural-object-slot neural-object-slot--${offsetName}${offset === 0 ? " is-selected" : ""}`;

          if (!project) {
            return (
              <div
                className={`${className} is-empty`}
                data-model-slot={index + 1}
                key={`empty-${index}`}
                aria-hidden="true"
              >
                {/* Future project GLB integration point. */}
              </div>
            );
          }

          const modelPath = PROJECT_MODEL_PATHS[project.name.toLowerCase()];

          return (
            <div
              className={className}
              data-model-slot={index + 1}
              key={project.id}
            >
              {modelPath ? (
                <ProjectModelPreview path={modelPath} />
              ) : /* Future project GLB integration point. */
              null}
              <button
                className="neural-object-select"
                type="button"
                aria-label={`Select ${project.name}`}
                aria-pressed={offset === 0}
                tabIndex={offset === 0 ? 0 : -1}
                onClick={() => {
                  if (project.id !== selected?.id) hideHistory();
                  setSelectedId(project.id);
                }}
              />
            </div>
          );
        })}

        {loading && (
          <p className="neural-system-message" role="status">
            READING PROJECT MEMORY...
          </p>
        )}

        {status === "error" && (
          <div className="neural-system-message" role="alert">
            <p>{error || "PROJECT MEMORY UNAVAILABLE"}</p>
            <button type="button" onClick={() => void load()}>
              RETRY
            </button>
            <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
              OPEN GITHUB ↗
            </a>
          </div>
        )}
      </main>

      <aside className="neural-project-info" aria-live="polite">
        {selected ? (
          <>
            <h2>{selected.name}</h2>
            {historyVisible ? (
              <div className="neural-history">
                {history.status === "loading" && <p>LOADING HISTORY...</p>}
                {history.status === "error" && <p>{history.error}</p>}
                {history.status === "ready" && history.commits.length === 0 && (
                  <p>NO COMMITS</p>
                )}
                {history.status === "ready" && history.commits.length > 0 && (
                  <ol>
                    {history.commits.map((commit) => (
                      <li key={commit.sha}>
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>{commit.message}</span>
                          <time dateTime={commit.date}>
                            {dateFormat.format(new Date(commit.date))}
                          </time>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ) : (
              <>
                <p className="neural-project-description">
                  {selected.description || "No project description recorded."}
                </p>
                <dl>
                  <div>
                    <dt>LANG</dt>
                    <dd>{selected.language ?? "UNSPECIFIED"}</dd>
                  </div>
                  <div>
                    <dt>UPDATED</dt>
                    <dd>
                      <time dateTime={selected.updated_at}>
                        {dateFormat.format(new Date(selected.updated_at))}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>STARS</dt>
                    <dd>{selected.stargazers_count}</dd>
                  </div>
                </dl>
              </>
            )}
          </>
        ) : (
          <p>{loading ? "LOADING PROJECTS..." : "NO PROJECT DATA"}</p>
        )}
      </aside>

      <footer className="neural-controls" aria-label="Project memory controls">
        {selected ? (
          <a href={selected.html_url} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">×</span> OPEN
          </a>
        ) : (
          <span className="is-disabled">
            <span aria-hidden="true">×</span> OPEN
          </span>
        )}
        <span className="neural-select-controls">
          <button
            type="button"
            aria-label="Previous project"
            disabled={!projects.length}
            onClick={() => selectRelative(-1)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next project"
            disabled={!projects.length}
            onClick={() => selectRelative(1)}
          >
            →
          </button>
          <span>SELECT</span>
        </span>
        <button
          type="button"
          disabled={!selected}
          aria-expanded={historyVisible}
          onClick={() => void toggleHistory()}
        >
          <span aria-hidden="true">△</span> HISTORY
        </button>
        <button type="button" onClick={beginBrainExit}>
          <span aria-hidden="true">○</span> RETURN
        </button>
      </footer>
    </>
  );
}
