import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { films } from "../../data/photos";
import { usePanelStore } from "../store/usePanelStore";
import FilmRollCarousel from "./FilmRollCarousel";
import "./PhotographyInterface.css";

type Film = (typeof films)[number];
type ViewTransition = {
  target: "viewer" | "library";
  phase: "cover" | "reveal";
  filmId?: string;
};
const defaultFilmIndex = Math.max(0, films.findIndex((film) => film.id === "Fomapan400"));

const photoVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 95,
    scale: 0.965,
    filter: "blur(9px)",
  }),
  center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -95,
    scale: 0.985,
    filter: "blur(7px)",
  }),
};

const previewVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 26 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -26 }),
};

const filmDetailsVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 26, pointerEvents: "none" as const }),
  center: { opacity: 1, x: 0, pointerEvents: "auto" as const },
  exit: (direction: number) => ({ opacity: 0, x: direction * -26, pointerEvents: "none" as const }),
};

function FilmFrame({ film, photo, index }: { film: Film; photo: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const frameNumber = String(index + 1).padStart(2, "0");

  return (
    <figure className="photo-frame">
      <div className="photo-frame-image">
        {failed ? (
          <span className="photo-frame-missing">SCAN UNAVAILABLE</span>
        ) : (
          <img
            src={photo}
            alt={`${film.title}, frame ${frameNumber}`}
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </figure>
  );
}

export default function PhotographyInterface() {
  const closePhotography = usePanelStore((state) => state.closePhotography);
  const enteredByCamera = usePanelStore((state) => state.photographyEnteredByCamera);
  const [entryFlashActive, setEntryFlashActive] = useState(enteredByCamera);
  const [rollsReady, setRollsReady] = useState(false);
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);
  const [viewTransition, setViewTransition] = useState<ViewTransition | null>(null);
  const [activeFilmStep, setActiveFilmStep] = useState(defaultFilmIndex);
  const [filmDirection, setFilmDirection] = useState(1);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const selectedFilm = films.find((film) => film.id === selectedFilmId);
  const activeFilmIndex = ((activeFilmStep % films.length) + films.length) % films.length;
  const activeFilm = films[activeFilmIndex];
  const previousFilm = films[(activeFilmIndex - 1 + films.length) % films.length];
  const nextFilm = films[(activeFilmIndex + 1) % films.length];
  const currentPhoto = selectedFilm?.photos[photoIndex];
  const previousPhoto = selectedFilm?.photos[photoIndex - 1];
  const nextPhoto = selectedFilm?.photos[photoIndex + 1];
  const slideTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.58, ease: [0.22, 1, 0.36, 1] as const };
  const interfaceRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const markRollsReady = useCallback(() => setRollsReady(true), []);

  const showRolls = useCallback(() => {
    if (viewTransition || !selectedFilmId) return;
    if (reduceMotion) {
      setSelectedFilmId(null);
      setPhotoIndex(0);
      requestAnimationFrame(() => {
        interfaceRef.current?.querySelector<HTMLButtonElement>(".film-carousel-explore")?.focus();
      });
    } else {
      setViewTransition({ target: "library", phase: "cover" });
    }
  }, [reduceMotion, selectedFilmId, viewTransition]);

  const navigatePhoto = useCallback((direction: -1 | 1) => {
    if (!selectedFilm) return;
    setTransitionDirection(direction);
    setPhotoIndex((index) =>
      Math.max(0, Math.min(selectedFilm.photos.length - 1, index + direction)),
    );
  }, [selectedFilm]);

  const navigateFilm = useCallback((direction: -1 | 1) => {
    setFilmDirection(direction);
    setActiveFilmStep((step) => step + direction);
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement;
    interfaceRef.current?.focus({ preventScroll: true });
    return () => {
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (selectedFilmId) viewerRef.current?.focus({ preventScroll: true });
  }, [selectedFilmId]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (viewTransition) {
        if (["Escape", "Tab", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (selectedFilm) showRolls();
        else closePhotography();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        if (selectedFilm) navigatePhoto(direction);
        else navigateFilm(direction);
        return;
      }

      if (event.key !== "Tab") return;
      const controls = [
        ...(interfaceRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], [tabindex='0']",
        ) ?? []),
      ];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [closePhotography, navigateFilm, navigatePhoto, selectedFilm, showRolls, viewTransition]);

  const selectFilm = (filmId: string) => {
    if (viewTransition) return;
    const firstPhoto = films.find((film) => film.id === filmId)?.photos[0];
    if (firstPhoto) {
      const preload = new Image();
      preload.src = firstPhoto;
    }
    setPhotoIndex(0);
    setTransitionDirection(1);
    if (reduceMotion) setSelectedFilmId(filmId);
    else setViewTransition({ target: "viewer", phase: "cover", filmId });
  };

  const advanceViewTransition = () => {
    if (!viewTransition) return;
    if (viewTransition.phase === "cover") {
      setSelectedFilmId(viewTransition.target === "viewer" ? viewTransition.filmId ?? null : null);
      setPhotoIndex(0);
      setTransitionDirection(1);
      setViewTransition({ ...viewTransition, phase: "reveal" });
    } else {
      setViewTransition(null);
      if (viewTransition.target === "library") {
        requestAnimationFrame(() => {
          interfaceRef.current?.querySelector<HTMLButtonElement>(".film-carousel-explore")?.focus();
        });
      }
    }
  };

  return (
    <section
      ref={interfaceRef}
      className={`photo-interface${selectedFilm ? " photo-interface--viewing" : ""}${entryFlashActive ? " photo-interface--camera-entry" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-screen-title"
      tabIndex={-1}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setEntryFlashActive(false);
      }}
    >
      {entryFlashActive && <div className="photo-entry-flash" aria-hidden="true" />}
      {viewTransition && (
        <div
          className={`photo-scene-transition photo-scene-transition--${viewTransition.phase}`}
          aria-hidden="true"
          onAnimationEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              ["photo-scene-blur-cover", "photo-scene-blur-reveal"].includes(event.animationName)
            ) {
              advanceViewTransition();
            }
          }}
        />
      )}
      <AnimatePresence initial={false}>
        {currentPhoto && (
          <motion.div
            key={currentPhoto}
            className="photo-viewer-backdrop"
            style={{ backgroundImage: `url(${currentPhoto})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.65 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <header className="photo-header">
        <div>
          <h2 id="photo-screen-title">PHOTOGRAPHY</h2>
        </div>
        <button
          type="button"
          className="photo-return"
          onClick={selectedFilm ? showRolls : closePhotography}
        >
          {selectedFilm ? (
            <>ESC <span className="photo-return-rule" aria-hidden="true">—</span> ALL ROLLS</>
          ) : (
            <><span aria-hidden="true">↖</span> RETURN TO CHARACTER</>
          )}
        </button>
      </header>

      {selectedFilm ? (
        <div className="photo-viewer" ref={viewerRef} tabIndex={-1}>
          <div className="photo-viewer-main">
            {selectedFilm.photos.length ? (
              <>
              <button
                type="button"
                className="photo-nav photo-nav--previous"
                onClick={() => navigatePhoto(-1)}
                aria-label="Previous photo"
                disabled={photoIndex === 0}
              >
                <span className="photo-nav-preview" aria-hidden="true">
                  <AnimatePresence initial={false} custom={transitionDirection}>
                    {previousPhoto && (
                      <motion.img
                        key={previousPhoto}
                        src={previousPhoto}
                        alt=""
                        custom={transitionDirection}
                        variants={previewVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={slideTransition}
                      />
                    )}
                  </AnimatePresence>
                </span>
                <span className="photo-nav-arrow" aria-hidden="true">←</span>
              </button>
              <div className="photo-single-stage">
                <AnimatePresence initial={false} custom={transitionDirection}>
                  <motion.div
                    key={`${selectedFilm.id}-${photoIndex}`}
                    className="photo-slide"
                    custom={transitionDirection}
                    variants={photoVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                  >
                    <FilmFrame
                      film={selectedFilm}
                      photo={selectedFilm.photos[photoIndex]}
                      index={photoIndex}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <button
                type="button"
                className="photo-nav photo-nav--next"
                onClick={() => navigatePhoto(1)}
                aria-label="Next photo"
                disabled={photoIndex >= selectedFilm.photos.length - 1}
              >
                <span className="photo-nav-preview" aria-hidden="true">
                  <AnimatePresence initial={false} custom={transitionDirection}>
                    {nextPhoto && (
                      <motion.img
                        key={nextPhoto}
                        src={nextPhoto}
                        alt=""
                        custom={transitionDirection}
                        variants={previewVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={slideTransition}
                      />
                    )}
                  </AnimatePresence>
                </span>
                <span className="photo-nav-arrow" aria-hidden="true">→</span>
              </button>
              </>
            ) : (
              <p className="photo-empty">No scans have been added to this roll yet.</p>
            )}
          </div>
          <div className="photo-viewer-footer">
            <div className="photo-viewer-info">
              <h3>{selectedFilm.title}</h3>
              <span className="photo-frame-count" aria-live="polite">
                {String(selectedFilm.photos.length ? photoIndex + 1 : 0).padStart(2, "0")} / {String(selectedFilm.photos.length).padStart(2, "0")}
              </span>
            </div>
            <button type="button" className="photo-all-rolls" onClick={showRolls}>
              <span className="photo-grid-icon" aria-hidden="true" /> ALL ROLLS
            </button>
          </div>
        </div>
      ) : (
        <div className={`photo-library${rollsReady ? " photo-library--ready" : ""}`}>
          <div className="film-carousel-stage">
            <div className="film-carousel-canvas">
              <FilmRollCarousel activeStep={activeFilmStep} onReady={markRollsReady} />
            </div>
            <div className="film-carousel-haze film-carousel-haze--left" aria-hidden="true" />
            <div className="film-carousel-haze film-carousel-haze--right" aria-hidden="true" />
            <button
              type="button"
              className="film-carousel-arrow film-carousel-arrow--previous"
              onClick={() => navigateFilm(-1)}
              aria-label={`Previous film: ${previousFilm.title}`}
            >
              ←
            </button>
            <button
              type="button"
              className="film-carousel-arrow film-carousel-arrow--next"
              onClick={() => navigateFilm(1)}
              aria-label={`Next film: ${nextFilm.title}`}
            >
              →
            </button>
          </div>
          <div className="film-carousel-details-slot">
            <AnimatePresence initial={false} custom={filmDirection}>
              <motion.div
                key={activeFilm.id}
                className="film-carousel-details"
                custom={filmDirection}
                variants={filmDetailsVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <h3>{activeFilm.title}</h3>
                <span className="film-carousel-rule" aria-hidden="true" />
                <p>{activeFilm.year} <span aria-hidden="true">/</span> {String(activeFilm.photos.length).padStart(2, "0")} FRAMES <span aria-hidden="true">/</span> 35 MM</p>
                <button type="button" className="film-carousel-explore" onClick={() => selectFilm(activeFilm.id)}>
                  EXPLORE PHOTOS <span aria-hidden="true">→</span>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="film-carousel-footer" aria-hidden="true">
            <span>{String(activeFilmIndex + 1).padStart(2, "0")} / {String(films.length).padStart(2, "0")} <span className="film-carousel-footer-line" /></span>
            <span>FILM LIVES LONGER <span className="film-carousel-footer-line film-carousel-footer-line--short" /></span>
          </div>
        </div>
      )}
    </section>
  );
}
