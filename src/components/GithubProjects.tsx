import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { filterRepositories, GITHUB_PROFILE } from "../lib/github";
import type { RepositorySort } from "../lib/github";
import { useGithubStore } from "../store/useGithubStore";
import { usePanelStore } from "../store/usePanelStore";
import RepoSaveIcon from "./RepoSaveIcon";

const dateFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default function GithubProjects() {
  const { repositories, status, error, load } = useGithubStore();
  const close = usePanelStore((state) => state.setActivePanel);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState<RepositorySort>("updated");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const optionRef = useRef<HTMLInputElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0 });
  }, [query, language, sort]);
  useEffect(() => {
    if (optionsOpen) optionRef.current?.focus();
  }, [optionsOpen]);

  const languages = useMemo(
    () =>
      [
        ...new Set(repositories.map((repo) => repo.language ?? "Unspecified")),
      ].sort(),
    [repositories],
  );
  const visible = useMemo(
    () => filterRepositories(repositories, query, language, sort),
    [repositories, query, language, sort],
  );
  const selected = visible.find((repo) => repo.id === selectedId) ?? visible[0];
  const loading = status === "idle" || status === "loading";
  const ready = status === "ready";

  const moveSelection = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const columns = getComputedStyle(
      gridRef.current!,
    ).gridTemplateColumns.split(" ").length;
    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = visible.length - 1;
    else if (event.key in steps)
      next = Math.max(
        0,
        Math.min(visible.length - 1, index + steps[event.key]),
      );
    else return;
    event.preventDefault();
    setSelectedId(visible[next].id);
    gridRef.current
      ?.querySelectorAll<HTMLButtonElement>(".save-slot")
      [next]?.focus();
  };

  return (
    <>
      <div className="memory-card-status" role="status">
        <span>
          {loading
            ? "Reading memory card…"
            : status === "error"
              ? "Unable to read memory card."
              : `${repositories.length} files · ${visible.length} displayed`}
        </span>
        <span>PUBLIC REPOSITORIES</span>
      </div>

      {optionsOpen && (
        <div className="memory-options" id="memory-options">
          <label className="memory-search">
            <span>Find a file</span>
            <input
              ref={optionRef}
              type="search"
              placeholder="Search repositories"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            <span>Language</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="all">All languages</option>
              {languages.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as RepositorySort)
              }
            >
              <option value="updated">Recently updated</option>
              <option value="stars">Most stars</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      )}

      <div className="memory-browser" aria-busy={loading}>
        {loading ? (
          <div className="memory-message">
            <span className="memory-reading" aria-hidden="true" />
            <p>Reading saved projects…</p>
          </div>
        ) : status === "error" ? (
          <div className="memory-message" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                void load();
              }}
            >
              Retry
            </button>
            <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
              Browse on GitHub ↗
            </a>
          </div>
        ) : visible.length === 0 ? (
          <div className="memory-message">
            <p>
              {repositories.length === 0
                ? "This memory card is empty."
                : "No files match your filters."}
            </p>
            {repositories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setLanguage("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            className="memory-grid"
            ref={gridRef}
            role="group"
            aria-label="Repository save files"
          >
            {visible.map((repository, index) => (
              <button
                type="button"
                key={repository.id}
                className={`save-slot${selected?.id === repository.id ? " is-selected" : ""}`}
                aria-pressed={selected?.id === repository.id}
                aria-label={`Select ${repository.name}`}
                tabIndex={selected?.id === repository.id ? 0 : -1}
                onClick={() => setSelectedId(repository.id)}
                onFocus={() => setSelectedId(repository.id)}
                onKeyDown={(event) => moveSelection(event, index)}
              >
                <span className="save-selection" aria-hidden="true" />
                <RepoSaveIcon repository={repository} />
                <span className="save-name">{repository.name}</span>
                <span className="save-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
        )}

        <aside
          className="memory-details"
          aria-label="Selected repository"
          aria-live="polite"
        >
          {ready && selected ? (
            <>
              <p className="memory-file-label">
                Selected file /{" "}
                {String(visible.indexOf(selected) + 1).padStart(2, "0")}
              </p>
              <h2>{selected.name}</h2>
              <p className="memory-description">
                {selected.description || "No description provided."}
              </p>
              <dl>
                <div>
                  <dt>Language</dt>
                  <dd>{selected.language ?? "Unspecified"}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>
                    <time dateTime={selected.updated_at}>
                      {dateFormat.format(new Date(selected.updated_at))}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>Stars</dt>
                  <dd>{selected.stargazers_count}</dd>
                </div>
                <div>
                  <dt>File type</dt>
                  <dd>
                    {selected.fork ? "Fork" : "Repository"}
                    {selected.archived ? " · Archived" : ""}
                  </dd>
                </div>
              </dl>
              <a
                className="memory-open"
                href={selected.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open repository <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <p className="memory-details-empty">
              {loading
                ? "Reading file information…"
                : "Select a file to view its information."}
            </p>
          )}
        </aside>
      </div>

      <footer className="memory-controls">
        {ready && selected ? (
          <a href={selected.html_url} target="_blank" rel="noopener noreferrer">
            <span className="pad-cross" aria-hidden="true">
              ×
            </span>{" "}
            Open
          </a>
        ) : (
          <span className="memory-control-disabled">
            <span className="pad-cross" aria-hidden="true">
              ×
            </span>{" "}
            Open
          </span>
        )}
        <button type="button" onClick={() => close(null)}>
          <span className="pad-circle" aria-hidden="true">
            ○
          </span>{" "}
          Back
        </button>
        <button
          ref={optionsButtonRef}
          type="button"
          aria-expanded={optionsOpen}
          aria-controls="memory-options"
          onClick={() => {
            setOptionsOpen(!optionsOpen);
            if (optionsOpen) optionsButtonRef.current?.focus();
          }}
        >
          <span className="pad-triangle" aria-hidden="true">
            △
          </span>{" "}
          Options
        </button>
        <span className="memory-navigation-hint">
          ← ↑ ↓ → <span>Select file</span>
        </span>
      </footer>
    </>
  );
}
