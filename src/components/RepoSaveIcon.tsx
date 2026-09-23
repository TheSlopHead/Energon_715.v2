import { useId } from "react";
import type { Repository } from "../lib/github";

// Original vector save icons; no game artwork or additional WebGL renderer.
export default function RepoSaveIcon({
  repository,
}: {
  repository: Repository;
}) {
  const id = useId().replaceAll(":", "");
  const name = repository.name.toLowerCase();
  const kind = /rogue|game/.test(name)
    ? "sword"
    : /neuro|ai|bot/.test(name)
      ? "network"
      : /energon/.test(name)
        ? "crystal"
        : /qr/.test(name)
          ? "card"
          : /dron|web|site/.test(name)
            ? "computer"
            : "folder";
  const color = {
    sword: "#a6ceee",
    network: "#64efc0",
    crystal: "#ee96cd",
    card: "#f5d77b",
    computer: "#a29bff",
    folder: "#6cb8f3",
  }[kind];

  return (
    <svg
      className="save-icon"
      viewBox="0 0 140 140"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${id}-face`}
          x1="30"
          y1="20"
          x2="110"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop offset="1" stopColor="#26344d" />
        </linearGradient>
        <linearGradient
          id={`${id}-edge`}
          x1="30"
          y1="20"
          x2="110"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f1f8ff" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor={color} stopOpacity=".4" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="70" cy="117" rx="43" ry="11" fill="#06122b" opacity=".3" />
      <ellipse cx="70" cy="117" rx="54" ry="14" fill={`url(#${id}-glow)`} />
      <g className="save-icon-object" strokeLinejoin="round">
        {kind === "crystal" && (
          <>
            <path
              d="M70 12 105 45 103 86 70 116 36 86 34 45Z"
              fill={`url(#${id}-face)`}
              stroke={color}
            />
            <path d="m70 12 12 44-12 60-14-60Z" fill={color} />
            <path
              d="m34 45 22 11 14-44Zm71 0L82 56 70 12Z"
              fill={`url(#${id}-edge)`}
            />
            <path
              d="m36 86 20-30 14 60Zm67 0L82 56l-12 60Z"
              fill="#542e69"
              opacity=".7"
            />
            <path
              d="m34 45 36 19 35-19M70 64v52"
              stroke="#ffe0f2"
              strokeOpacity=".7"
            />
            <path
              d="M22 71h12m-6-6v12m78-51h10m-5-5v10"
              stroke="#e6c6ef"
              strokeWidth="2"
            />
          </>
        )}
        {kind === "network" && (
          <>
            <path
              d="m70 20 39 24 9 40-28 26-43-6-25-32 15-36Z"
              fill={`url(#${id}-face)`}
              stroke={color}
              strokeWidth="2"
            />
            <path
              d="m70 20-9 37-24-21m24 21 48-13-29 37 38 3M61 57 22 72l58 9 10 29M47 104l14-47 19 24"
              stroke="#c6fff0"
              strokeWidth="2"
            />
            {[
              [70, 20],
              [109, 44],
              [118, 84],
              [90, 110],
              [47, 104],
              [22, 72],
              [37, 36],
              [61, 57],
              [80, 81],
            ].map(([x, y]) => (
              <circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="5"
                fill="#caffee"
                stroke="#44ab96"
                strokeWidth="2"
              />
            ))}
          </>
        )}
        {kind === "sword" && (
          <>
            <path
              d="m92 12 13 1 1 14-48 59-17-14Z"
              fill={`url(#${id}-edge)`}
              stroke="#d5eeff"
            />
            <path d="m105 13-54 67 7 6 48-59Z" fill="#467fac" />
            <path d="m33 65 35 29-7 8-35-29Z" fill="#d2a465" stroke="#fff0c1" />
            <path
              d="m41 84 10 9-21 24-10-9Z"
              fill="#323f76"
              stroke="#94b5f4"
              strokeWidth="2"
            />
            <path d="m16 103 19 16-8 8-19-16Z" fill="#d2a465" />
            <path
              d="m88 74 17 9v24l-17 11-17-11V83Z"
              fill="#34477a"
              stroke="#849fcf"
              strokeWidth="2"
            />
            <path d="m88 82 8 6v14l-8 6-8-6V88Z" fill="#a1bedf" />
          </>
        )}
        {kind === "computer" && (
          <>
            <path d="m24 27 78-8 18 12-77 9Z" fill={`url(#${id}-edge)`} />
            <path d="m24 27 19 13v64L24 90Z" fill="#454765" />
            <path
              d="m43 40 77-9v62l-77 11Z"
              fill={`url(#${id}-face)`}
              stroke="#c7c8f7"
            />
            <path
              d="m51 47 61-7v42l-61 8Z"
              fill="#10242f"
              stroke="#4d6082"
              strokeWidth="3"
            />
            <path
              d="m61 55 9 6-9 8m16 3 20-3"
              stroke="#93f8d7"
              strokeWidth="3"
            />
            <path
              d="m76 100 15-2 2 14 19 6-57 8-14-9 34-4Z"
              fill={`url(#${id}-edge)`}
            />
            <circle cx="105" cy="90" r="2" fill="#9bffcd" />
          </>
        )}
        {kind === "card" && (
          <>
            <path d="m36 20 59-6 18 13v85l-59 9-18-13Z" fill="#7e672d" />
            <path
              d="m54 33 59-6v85l-59 9Z"
              fill={`url(#${id}-face)`}
              stroke="#ffe4a3"
            />
            <path d="m36 20 18 13 59-6-18-13Z" fill={`url(#${id}-edge)`} />
            <path d="m64 44 39-5v44l-39 5Z" fill="#efebd4" />
            <path
              d="m69 49 10-1v10l-10 1Zm18-2 10-1v10l-10 1ZM69 69l10-1v10l-10 1Zm18-8 5-1v7l5-1v11l-10 1Z"
              fill="#303b43"
            />
            <path
              d="m66 102 33-4"
              stroke="#fff0b9"
              strokeWidth="4"
              strokeDasharray="4 3"
            />
          </>
        )}
        {kind === "folder" && (
          <>
            <path
              d="m23 41 35-8 14 10 38-8 8 13v57l-81 18-14-14Z"
              fill="#3a6697"
              stroke="#a6d8ff"
            />
            <path
              d="m37 65 81-17-10 60-81 16Z"
              fill={`url(#${id}-face)`}
              stroke="#a6d8ff"
              strokeWidth="2"
            />
            <path
              d="m56 81-10 10 8 5m36-22 9 5-11 9m-17-9-6 20"
              stroke="#e1f4ff"
              strokeWidth="3"
            />
          </>
        )}
      </g>
    </svg>
  );
}
