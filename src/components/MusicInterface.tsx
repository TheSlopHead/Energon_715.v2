import { useEffect, useRef, useState } from "react";
import { musicDestinations, musicTrackPreviews, type MusicDestination } from "../content/music";
import { usePanelStore } from "../store/usePanelStore";
import AmbientParticles from "./AmbientParticles";
import "./MusicInterface.css";

function ServiceMark({ service }: { service: MusicDestination["service"] }) {
  if (service === "spotify") {
    return (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="currentColor" />
        <path d="M9 15.2c7.8-2.2 15.8-1.4 22.4 2.7M10.8 21c6.6-1.7 13.3-1 18.9 2.5M12.3 26.2c5.3-1.2 10.6-.6 15 2.1" stroke="var(--music-card-bg)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 1.5v37M1.5 20h37M6.9 6.9l26.2 26.2M33.1 6.9 6.9 33.1M12.9 2.9l14.2 34.2M27.1 2.9 12.9 37.1M2.9 12.9l34.2 14.2M37.1 12.9 2.9 27.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.1" fill="currentColor" />
    </svg>
  );
}

function Artwork({ destination }: { destination: MusicDestination }) {
  const [missing, setMissing] = useState(false);

  return (
    <div className="music-card__art" aria-hidden="true">
      <div className="music-card__cd" />
      <div className={`music-card__sleeve music-card__sleeve--${destination.service}`}>
        {!missing && (
          <img src={destination.cover} alt="" onError={() => setMissing(true)} />
        )}
        {missing && (
          <div className="music-card__sleeve-placeholder">
            <span className="music-card__sleeve-index">ENERGON715 / SOUND ARCHIVE</span>
            <span className="music-card__sleeve-symbol">
              <ServiceMark service={destination.service} />
            </span>
            <span className="music-card__sleeve-title">{destination.coverTitle}</span>
            <span className="music-card__sleeve-foot">DISC {destination.side} · DIGITAL AUDIO</span>
          </div>
        )}
      </div>
      <div className="music-card__art-caption">
        <span>{destination.featuredTrack}</span>
        <small>DISC {destination.side} / SELECTED TRACK</small>
      </div>
    </div>
  );
}

function DestinationCard({ destination }: { destination: MusicDestination }) {
  return (
    <a
      className={`music-card music-card--${destination.service}`}
      href={destination.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open artist page in ${destination.name} (new tab)`}
    >
      <div className="music-card__top">
        <span className="music-card__brand">
          <ServiceMark service={destination.service} />
          <span>{destination.name}</span>
        </span>
        <span className="music-card__top-link">{destination.openLabel} <span aria-hidden="true">↗</span></span>
      </div>

      <div className="music-card__main">
        <Artwork destination={destination} />
        <div className="music-card__directory">
          <p className="music-card__directory-heading">CATALOG / DISC {destination.side}</p>
          <ol className="music-card__track-list">
            {musicTrackPreviews.map((track, index) => (
              <li
                key={track.title}
                className={track.title === destination.featuredTrack ? "music-card__track music-card__track--featured" : "music-card__track"}
              >
                <span className="music-card__track-number">{String(index + 1).padStart(2, "0")}</span>
                {track.cover ? <img src={track.cover} alt="" loading="lazy" /> : <span className="music-card__track-cover" aria-hidden="true" />}
                <span className="music-card__track-title">{track.title}</span>
                <span className="music-card__track-duration">{track.duration}</span>
              </li>
            ))}
          </ol>
          <div className="music-card__signal"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <p className="music-card__directory-foot">OPEN ARTIST TO LISTEN ↗</p>
        </div>
      </div>

      <div className="music-card__bottom">
        <span className="music-card__side">DISC {destination.side} <small>→</small> {destination.name}</span>
        <span className="music-card__listen">{destination.listenLabel} <span aria-hidden="true">↗</span></span>
      </div>
    </a>
  );
}

export default function MusicInterface() {
  const closeMusic = usePanelStore((state) => state.closeMusic);
  const interfaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    interfaceRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMusic();
      }
      if (event.key !== "Tab") return;
      const elements = [...(interfaceRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? [])];
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === interfaceRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, [closeMusic]);

  return (
    <section
      ref={interfaceRef}
      className="music-interface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="music-title"
      tabIndex={-1}
    >
      <div className="music-interface__grain" aria-hidden="true" />
      <AmbientParticles variant="music" />
      <div className="music-interface__content">
        <header className="music-header">
          <div>
            <h1 id="music-title">MUSIC</h1>
            <p>TWO PLACES TO LISTEN</p>
          </div>
          <button type="button" onClick={closeMusic} aria-label="Return to character">
            <span aria-hidden="true">⟵</span> RETURN TO CHARACTER
          </button>
        </header>
        <main className="music-grid" aria-label="Music services">
          {musicDestinations.map((destination) => (
            <DestinationCard key={destination.service} destination={destination} />
          ))}
        </main>
        <footer className="music-footer">
          <span>ENERGON715 / MUSIC INDEX</span>
          <span>CHOOSE A DISC · FOLLOW THE SOUND</span>
        </footer>
      </div>
    </section>
  );
}
