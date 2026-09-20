import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { telegramPosts } from "../content/telegramPosts";
import type { TelegramPost } from "../content/telegramPosts";
import "./TelegramBackdrop.css";

const CARD_COUNT = 16;

type DriftStyle = CSSProperties & Record<`--${string}`, string>;

interface CardStyle extends DriftStyle {
  left: string;
  top: string;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function buildCardStyles(count: number): CardStyle[] {
  const rand = mulberry32(1347);

  return Array.from({ length: count }, () => {
    const quadrant = Math.floor(rand() * 4);
    const left = quadrant % 2 === 0 ? rand() * 30 : 70 + rand() * 30;
    const top = quadrant < 2 ? rand() * 35 : 65 + rand() * 35;
    const opacity = 0.45 + rand() * 0.2;

    const travel = 140 + rand() * 80;
    const start = rand() * 40 - 20;
    const direction = rand() < 0.5 ? -1 : 1;
    const duration = 16 + rand() * 14;

    const style: CardStyle = {
      left: `${left}%`,
      top: `${top}%`,
      "--card-opacity": opacity.toFixed(3),
      "--drift-from": `${start.toFixed(1)}px`,
      "--drift-to": `${(start + direction * travel).toFixed(1)}px`,
      "--drift-dur": `${duration.toFixed(2)}s`,
      "--drift-delay": `-${(rand() * duration).toFixed(2)}s`,
    };
    return style;
  });
}

function initialPosts(count: number): TelegramPost[] {
  const posts = telegramPosts.slice().sort((a, b) => a.id - b.id);
  const step = Math.max(1, Math.floor(posts.length / count));
  return Array.from(
    { length: count },
    (_, i) => posts[(i * step) % posts.length],
  );
}

export default function TelegramBackdrop() {
  const styles = useMemo(() => buildCardStyles(CARD_COUNT), []);
  const [posts, setPosts] = useState(() => initialPosts(CARD_COUNT));
  const nextRef = useRef(CARD_COUNT);

  const recycle = (slot: number) => {
    const next = telegramPosts[nextRef.current % telegramPosts.length];
    nextRef.current += 1;
    setPosts((prev) => prev.map((post, i) => (i === slot ? next : post)));
  };

  return (
    <div className="tg-backdrop" aria-hidden>
      {posts.map((post, slot) => (
        <div
          key={slot}
          className="tg-card"
          style={styles[slot]}
          onAnimationIteration={() => recycle(slot)}
        >
          <span className="tg-card-date">&gt; {formatDate(post.date)}</span>
          <p className="tg-card-text">{post.text}</p>
        </div>
      ))}
    </div>
  );
}
