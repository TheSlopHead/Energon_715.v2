import { GITHUB_PROFILE } from "../lib/github";
import "./HeroIdentity.css";

export default function HeroIdentity() {
  return (
    <>
      <section className="hero-identity" aria-labelledby="hero-name">
        <p className="hero-subject">SUBJECT / 0715</p>
        <h1 id="hero-name">ENERGON715</h1>
        <p className="hero-role">GO DEVELOPER / WEB EXPERIMENTS</p>
        <p className="hero-description">
          writing Go, building strange websites, shooting film and collecting
          noise.
        </p>
      </section>
      <nav className="hero-links" aria-label="Profile links">
        <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a
          href="https://t.me/dronizm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </a>
      </nav>
    </>
  );
}
