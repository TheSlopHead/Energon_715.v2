export type MusicDestination = {
  service: "spotify" | "yandex";
  name: string;
  side: "A" | "B";
  url: string;
  cover: string;
  coverTitle: string;
  openLabel: string;
  listenLabel: string;
  featuredTrack: string;
};

export type MusicTrackPreview = {
  title: string;
  duration: string;
  cover?: string;
};

// These are display-only catalog entries. Artist URLs do not identify individual tracks.
export const musicTrackPreviews: MusicTrackPreview[] = [
  { title: "Mysterious Evening", duration: "2:54", cover: "/music/Mysterious%20Evening_640x640.jpg" },
  { title: "Beautiful hills", duration: "2:53", cover: "/music/Beautiful%20hills_640x640.jpg" },
  { title: "Soft Blanket", duration: "1:11", cover: "/music/Soft%20Blanket_640x640.jpg" },
  { title: "Strange New Year", duration: "1:55", cover: "/music/Strange%20New%20Year_640x640.jpg" },
];

// Each link leads to the artist's full catalog, including albums and singles.
export const musicDestinations: MusicDestination[] = [
  {
    service: "spotify",
    name: "Spotify",
    side: "A",
    url: "https://open.spotify.com/artist/0gJdSAa9OqrdkyMI8yubg0?si=EhHv97D3RGmHkAy1t3HWjg",
    cover: "/music/Mysterious%20Evening_640x640.jpg",
    coverTitle: "MYSTERIOUS EVENING",
    openLabel: "OPEN IN SPOTIFY",
    listenLabel: "LISTEN ON SPOTIFY",
    featuredTrack: "Mysterious Evening",
  },
  {
    service: "yandex",
    name: "Яндекс Музыка",
    side: "B",
    url: "https://music.yandex.ru/artist/9729779",
    cover: "/music/Soft%20Blanket_640x640.jpg",
    coverTitle: "SOFT BLANKET",
    openLabel: "ОТКРЫТЬ В ЯНДЕКС МУЗЫКЕ",
    listenLabel: "СЛУШАТЬ В ЯНДЕКС МУЗЫКЕ",
    featuredTrack: "Soft Blanket",
  },
];
