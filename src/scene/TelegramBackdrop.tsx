import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { telegramPosts } from "../content/telegramPosts";
import type { TelegramPost } from "../content/telegramPosts";
import "./TelegramBackdrop.css";

const STREAM_COUNT = 18;
const LANE_POSITIONS = [8, 24, 40, 60, 76, 92];
const orderedPosts = telegramPosts
  .filter((post) => post.text.trim().length > 0)
  .slice()
  .sort((a, b) => a.id - b.id);

type Depth = "far" | "middle" | "near";
type ThoughtStyle = CSSProperties & Record<`--${string}`, string>;

interface StreamThought {
  depth: Depth;
  slot: number;
  style: ThoughtStyle;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function excerpt(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 150
    ? `${normalized.slice(0, 147).trimEnd()}…`
    : normalized;
}

function buildStream(): StreamThought[] {
  const depths: Depth[] = ["far", "middle", "near"];
  return Array.from({ length: STREAM_COUNT }, (_, slot) => {
    const depth = depths[slot % depths.length];
    const lane = slot % LANE_POSITIONS.length;
    const duration = 64 + (slot % 7) * 5;
    const top = -8 + (slot / STREAM_COUNT) * 116;
    const opacityBase = depth === "far" ? 0.1 : depth === "middle" ? 0.15 : 0.21;

    return {
      depth,
      slot,
      style: {
        left: `${LANE_POSITIONS[lane]}%`,
        top: `${top.toFixed(2)}%`,
        "--thought-opacity": (opacityBase + (slot % 3) * 0.015).toFixed(3),
        "--stream-duration": `${duration}s`,
        "--stream-delay": `-${((slot / STREAM_COUNT) * duration).toFixed(2)}s`,
        "--stream-x": `${((slot % 5) - 2) * 7}px`,
        "--stream-start-x": `${((slot % 5) - 2) * -7}px`,
      },
    };
  });
}

function initialPosts(): TelegramPost[] {
  return Array.from(
    { length: STREAM_COUNT },
    (_, index) => orderedPosts[index % orderedPosts.length],
  );
}

export default function TelegramBackdrop() {
  const stream = useMemo(() => buildStream(), []);
  const [posts, setPosts] = useState(initialPosts);
  const nextPost = useRef(STREAM_COUNT);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let hovered: HTMLElement | null = null;

    const update = () => {
      frame = 0;
      const backdrop = backdropRef.current;
      if (!backdrop) return;

      backdrop.style.setProperty("--parallax-far-x", `${pointerX * -3}px`);
      backdrop.style.setProperty("--parallax-far-y", `${pointerY * -2}px`);
      backdrop.style.setProperty("--parallax-middle-x", `${pointerX * -5}px`);
      backdrop.style.setProperty("--parallax-middle-y", `${pointerY * -3}px`);
      backdrop.style.setProperty("--parallax-near-x", `${pointerX * -8}px`);
      backdrop.style.setProperty("--parallax-near-y", `${pointerY * -5}px`);

      const clientX = ((pointerX + 1) / 2) * window.innerWidth;
      const clientY = ((pointerY + 1) / 2) * window.innerHeight;
      let nextHovered: HTMLElement | null = null;
      for (const thought of backdrop.querySelectorAll<HTMLElement>(
        ".tg-thought",
      )) {
        const bounds = thought.getBoundingClientRect();
        if (
          clientX >= bounds.left &&
          clientX <= bounds.right &&
          clientY >= bounds.top &&
          clientY <= bounds.bottom
        ) {
          nextHovered = thought;
          break;
        }
      }

      if (hovered !== nextHovered) {
        hovered?.classList.remove("is-hovered");
        nextHovered?.classList.add("is-hovered");
        hovered = nextHovered;
      }
    };

    const scheduleUpdate = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const reset = () => {
      pointerX = 0;
      pointerY = 0;
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", scheduleUpdate, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", scheduleUpdate);
      document.documentElement.removeEventListener("pointerleave", reset);
      if (frame) window.cancelAnimationFrame(frame);
      hovered?.classList.remove("is-hovered");
    };
  }, []);

  const recycle = (slot: number) => {
    const post = orderedPosts[nextPost.current % orderedPosts.length];
    nextPost.current += 1;
    setPosts((current) =>
      current.map((existing, index) => (index === slot ? post : existing)),
    );
  };

  return (
    <div ref={backdropRef} className="tg-backdrop" aria-hidden="true">
      {(["far", "middle", "near"] as const).map((depth) => (
        <div className={`tg-depth-plane tg-depth-plane--${depth}`} key={depth}>
          {stream
            .filter((thought) => thought.depth === depth)
            .map(({ slot, style }) => {
              const post = posts[slot];
              return (
                <div
                  className="tg-thought"
                  data-slot={slot}
                  key={slot}
                  style={style}
                  onAnimationIteration={() => recycle(slot)}
                >
                  <p>{excerpt(post.text)}</p>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
