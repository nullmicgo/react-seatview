# hong-kong-cinema

A React component for a cinema seat preview. Visitors pick a film and a seat, then the camera flies down to that chair and shows the screen from there.

The component draws the hall with Three.js. You pass the films, the trailer files, and the two sitting models. Posters, trailers, and models stay in your app. They are not part of this package.

## Install

```bash
npm install hong-kong-cinema react react-dom three
```

React 18 or newer, and Three.js 0.170 or newer, are required.

## Use

Give the parent a height, or leave the default, which fills the viewport. Import the stylesheet once.

```tsx
import { CinemaPreview } from "hong-kong-cinema";
import "hong-kong-cinema/style.css";

const films = [
  {
    id: "evening",
    title: "The Mission",
    zh: "鎗火",
    meta: "IIB · 84分鐘 · 劇情 · 粵語",
    formats: "2D IMAX",
    poster: "/poster.jpg",
    trailer: "/trailer.mp4",
    tags: ["2D", "IMAX"],
    slots: [
      { label: "07:45 PM · IMAX", time: "07:45 PM", house: "HOUSE 3 / IMAX", standard: 180, recliner: 230 },
    ],
  },
];

export function App() {
  return (
    <CinemaPreview
      films={films}
      audience={{ man: "/man.glb", woman: "/woman.glb" }}
      seatModel="/cinema-seat.glb"
      venue="Hong Kong Cinema"
      hall="Hall 3"
    />
  );
}
```

Serve the page over HTTP. Opening the file directly will not load the ES modules or the seat models.

`poster` and `trailer` are URLs your server can return. `audience.man` and `audience.woman` are GLB files of people in a sitting pose. Taken seats alternate between those two models. Recliner rows are H and I, and they are never taken.

`height="parent"` fills a parent that already has a height. The default `height="viewport"` uses the screen.

Hold only changes the button in the browser. It does not book a seat.

## What you can pass

| Prop | Required | Purpose |
| --- | --- | --- |
| `films` | yes | Posters, trailers, tags, and showtimes with standard and recliner prices |
| `audience` | yes | `{ man, woman }` URLs for the seated GLB models |
| `seatModel` | yes | GLB of one cinema seat, copied onto every chair |
| `venue`, `venueZh`, `hall` | no | Names on the lobby, showtimes, and seat chart |
| `dates` | no | Date chips. They only move the underline |
| `showingDate` | no | The date printed above the showtimes |
| `credit` | no | The mock-cinema line, author, and links in the lobby |
| `height` | no | `"viewport"` or `"parent"` |

## Develop this repo

```bash
npm install
npm run dev
```

The preview site is `apps/web`. The library source is `packages/hong-kong-cinema`.
