import { useEffect, useRef } from "react";
import "./AmbientParticles.css";

const PARTICLES = Array.from({ length: 48 }, (_, index) => ({
  left: `${(index * 73 + 11) % 100}%`,
  top: `${(index * 37 + 19) % 100}%`,
  animationDelay: `-${(index * 3.7) % 19}s`,
  animationDuration: `${10 + (index % 7) * 2}s`,
  opacity: 0.25 + (index % 5) * 0.1,
}));

export default function AmbientParticles({ variant, enabled = true }: {
  variant: "loading" | "scene" | "music";
  enabled?: boolean;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((variant !== "scene" && variant !== "music") || !enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0.5;
    let y = 0.5;
    const update = () => {
      frame = 0;
      const field = fieldRef.current;
      if (!field) return;
      const shift = variant === "music" ? 12 : 20;
      field.style.setProperty("--ambient-shift-x", `${(x - 0.5) * -shift}px`);
      field.style.setProperty("--ambient-shift-y", `${(y - 0.5) * -shift * 0.7}px`);
      field.style.setProperty("--ambient-pointer-x", `${x * 100}%`);
      field.style.setProperty("--ambient-pointer-y", `${y * 100}%`);
    };
    const move = (event: PointerEvent) => {
      x = event.clientX / window.innerWidth;
      y = event.clientY / window.innerHeight;
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const reset = () => {
      x = 0.5;
      y = 0.5;
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled, variant]);

  return (
    <div
      ref={fieldRef}
      className={`ambient-particles ambient-particles--${variant}${enabled ? "" : " ambient-particles--off"}`}
      aria-hidden="true"
    >
      {(variant === "music" ? PARTICLES.slice(0, 32) : PARTICLES).map((style, index) => (
        <span key={index} className="ambient-particle" style={style} />
      ))}
    </div>
  );
}
