import type { CinemaFilm } from "react-3d-cinema-preview";

export const films: CinemaFilm[] = [
  {
    id: "mission",
    title: "The Mission",
    zh: "鎗火",
    meta: "IIB · 84分鐘 · 劇情 · 粵語",
    formats: "2D IMAX",
    poster: "/poster001.jpeg",
    trailer: "/The Mission (1999) 鎗火 - Movie Trailer - Far East Films - Far East Films (720p, h264).mp4",
    tags: ["2D", "IMAX"],
    slots: [
      { label: "05:30 PM · 2D", time: "05:30 PM", house: "HOUSE 3 / 2D", standard: 120, recliner: 170 },
      { label: "07:45 PM · IMAX", time: "07:45 PM", house: "HOUSE 3 / IMAX", standard: 180, recliner: 230 },
      { label: "10:15 PM · 3D", time: "10:15 PM", house: "HOUSE 3 / 3D", standard: 145, recliner: 195 },
    ],
  },
  {
    id: "throwdown",
    title: "Throw Down",
    zh: "柔道龍虎榜",
    meta: "IIB · 95分鐘 · 劇情 · 粵語",
    formats: "2D",
    poster: "/Throw-Down-poster.jpg",
    trailer: "/Throw Down (2004) Original Trailer [4K] - HD Retro Trailers (1080p, h264).mp4",
    tags: ["2D"],
    slots: [
      { label: "02:30 PM · 2D", time: "02:30 PM", house: "HOUSE 3 / 2D", standard: 120, recliner: 170 },
      { label: "05:15 PM · 2D", time: "05:15 PM", house: "HOUSE 3 / 2D", standard: 120, recliner: 170 },
      { label: "08:00 PM · 2D", time: "08:00 PM", house: "HOUSE 3 / 2D", standard: 120, recliner: 170 },
    ],
  },
];

export const audience = { man: "/man.glb", woman: "/woman.glb" };

export const credit = {
  line: "This is a mock cinema app, not a real cinema.",
  author: "Michael Lau",
  links: [
    { label: "Website", href: "http://nullmicgo.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nullmicgo/" },
    { label: "YouTube", href: "https://www.youtube.com/@nullmicgo" },
  ],
};
