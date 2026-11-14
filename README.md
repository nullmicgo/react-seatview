# Hong Kong Cinema

A mock cinema app for picking a seat in Hall 3 and seeing the screen from that seat. It is not a real cinema, and it does not take payment.

Live preview: [mocl-hong-kong-cinema.nullmicgo.com](https://mocl-hong-kong-cinema.nullmicgo.com)

Developed by [Michael Lau](http://nullmicgo.com/).

## Screen flow

The page is four full-screen layers in one document. Only one task layer is interactive at a time. The WebGL canvas stays hidden until the visitor asks to see the seat.

```text
Lobby  →  Showtimes  →  Seat chart  →  Seat view
#lobby     #times         #map          #stage + #pov-chrome
```

1. **Lobby.** Date chips and two poster cards. The chips only move the underline. Both films stay listed on every date. The footer states that this is a mock.
2. **Showtimes.** Tapping a poster fills the title, rating line, and that film's slots. Each slot shows a time, the standard price, and `HOUSE 3`. Back returns to the lobby.
3. **Seat chart.** Tapping a slot writes that slot's standard and recliner prices, swaps the trailer if the film changed, and shows Hall 3. Row A is nearest the screen. Rows H and I are recliners. Taken seats cannot be selected. The footer shows the chosen seat and its price.
4. **Seat view.** **See this seat** unmutes the trailer and flies the camera from above the chair down to sitting height. A one-line bar names the seat. **Hold** only changes the button to "Held for you" in this browser. **Change**, or the back chevron, flies back to the chart and pauses the video. **Showtimes** returns to the slot list.

Dragging on the seat view looks a little left, right, up, and down. The look returns to the seat's aim when you leave.

## How it works

Everything lives in `index.html`. There is no framework, no bundler, and no server API. Tailwind and Three.js 0.170 are loaded from CDNs. Posters, trailers, and the two seated people are files next to the page, so the page has to be served over HTTP.

### Films and prices

`films` holds the two titles. A showtime button stores `standard` and `recliner` on the button. Choosing the slot copies those numbers onto the active film and points the `<video>` element at that film's mp4. Recliner seats (`row` H or I) use the recliner price. Every other seat uses the standard price.

The sample prices, in HKD:

| Film | Show | Standard | Recliner |
| --- | --- | --- | --- |
| 《鎗火》 | 05:30 PM · 2D | 120 | 170 |
| 《鎗火》 | 07:45 PM · IMAX | 180 | 230 |
| 《鎗火》 | 10:15 PM · 3D | 145 | 195 |
| 《柔道龍虎榜》 | 02:30, 05:15, 08:00 PM · 2D | 120 | 170 |

### Seat chart

Nine rows, A through I, twelve seats each, with an aisle between seats 6 and 7. The same list builds both the buttons and the 3D chairs.

A seat is taken when it is not a recliner and `(rowIndex * 5 + seatNumber * 3) % 7 === 0`. That is a fixed pattern, not a booking system. The chart scales each row slightly so the back rows read as farther from the screen.

Selecting a seat paints that chair mint in the 3D scene and writes the row, number, and price into the footer. The default seat is B4.

### The hall

The scene is a dark room. The screen is a 22 by 10 plane (about 2.2:1) at the front. A 16:9 trailer is cropped vertically so it fills that wide frame. The video element itself is a 1 pixel node on the page. Three.js samples it with a `VideoTexture` every frame.

Light comes from the screen. A `RectAreaLight` the size of the screen points back into the seats, with a very dim ambient fill. Seat backs stay dark. Seat tops and the people catch the screen light. Seat cloth is a `MeshPhysicalMaterial` with a little sheen. The selected chair swaps to a mint material.

The floor rises toward the back: each row is 1.46 units farther from the screen and 0.22 units higher. The camera's eye is just in front of the chosen seat back, at about sitting height, and looks slightly above that height toward the screen. On a tall phone the vertical field of view opens to 64 degrees so the row in front stays in frame above the bottom bar. On a wide window it stays at 52 degrees.

**See this seat** runs a quadratic bezier from an overhead view down to that eye point, over about 1.15 seconds, with an ease-out curve. `prefers-reduced-motion` skips the flight and cuts to the seat.

### People in taken seats

`man.glb` and `woman.glb` are static sitting meshes exported from Mixamo. Their vertices are in centimetres and stand along local -Z, so each clone is scaled by 0.01, rotated 90 degrees to stand up, then turned around by a parent group so the face points at the screen. Even seat indexes use the woman. Odd indexes use the man. Hair and glasses use alpha test instead of blended transparency so they sort correctly against the seats.

## Run it locally

```bash
python3 -m http.server 8771
```

Then open [http://127.0.0.1:8771/](http://127.0.0.1:8771/).

Opening `index.html` as a file fails. ES modules and the model loader need an HTTP origin.

## What is in this repo

| File | Role |
| --- | --- |
| `index.html` | Lobby, showtimes, seat chart, and the 3D hall |
| `poster001.jpeg` | Poster for 《鎗火》 |
| `Throw-Down-poster.jpg` | Poster for 《柔道龍虎榜》 |
| `man.glb`, `woman.glb` | Seated audience on taken seats |
| The two `.mp4` files | Trailers played on the cinema screen |

Posters and trailers are used here as a personal mock. They belong to their rights holders.

## Credits

- [Website](http://nullmicgo.com/)
- [LinkedIn](https://www.linkedin.com/in/nullmicgo/)
- [YouTube](https://www.youtube.com/@nullmicgo)
