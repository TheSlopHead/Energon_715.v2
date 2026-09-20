import { useEffect, useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { GITHUB_PROFILE, GITHUB_USERNAME } from "../lib/github";
import { usePanelStore } from "../store/usePanelStore";
import GithubProjects from "./GithubProjects";
import "./PanelContainer.css";

function BrainPanel() {
  const setActivePanel = usePanelStore((state) => state.setActivePanel);
  const panelAnchor = usePanelStore((state) => state.panelAnchor);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () =>
      panel.style.setProperty("--panel-height", `${panel.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActivePanel(null);
      }
      if (event.key !== "Tab") return;
      const elements = [
        ...(panelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button, input, select, [tabindex='0']",
        ) ?? []),
      ].filter(
        (element) => element.tabIndex >= 0 && !element.hasAttribute("disabled"),
      );
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previousFocus instanceof HTMLElement)
        previousFocus.focus({ preventScroll: true });
    };
  }, [setActivePanel]);

  return (
    <div className="panel-backdrop" onClick={() => setActivePanel(null)}>
      <section
        ref={panelRef}
        className="panel-content"
        style={
          {
            "--panel-x": `${panelAnchor.x}px`,
            "--panel-y": `${panelAnchor.y}px`,
          } as CSSProperties
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="panel-header">
          <div>
            <p className="memory-system-label">
              BROWSER <span>/ BRAIN</span>
            </p>
            <h1 id="panel-title">
              Memory Card <span>(GitHub) / 1</span>
            </h1>
            <a
              className="memory-owner"
              href={GITHUB_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
            >
              {GITHUB_USERNAME} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <button
            ref={closeRef}
            className="panel-close"
            type="button"
            aria-label="Close portfolio"
            onClick={() => setActivePanel(null)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <GithubProjects />
      </section>
    </div>
  );
}

export default function PanelContainer() {
  const activePanel = usePanelStore((state) => state.activePanel);
  return activePanel === "brain" ? <BrainPanel /> : null;
}
