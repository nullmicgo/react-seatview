# React 3D Cinema Preview

A React library for picking a cinema seat and seeing the screen from that chair. This repository's site is a mock Hong Kong cinema, Hall 3. It is not a real cinema, and it does not take payment.

The package is [`react-3d-cinema-preview`](https://www.npmjs.com/package/react-3d-cinema-preview). The site in `apps/web` renders that component.

Live preview: [mock-hong-kong-cinema.nullmicgo.com](https://mock-hong-kong-cinema.nullmicgo.com/)

## Install

```bash
npm install react-3d-cinema-preview react react-dom three
```

React 18 or newer and Three.js 0.170 or newer have to be installed too. Import the component and its stylesheet:

```tsx
import { CinemaPreview } from "react-3d-cinema-preview";
import "react-3d-cinema-preview/style.css";

export function App() {
  return (
    <CinemaPreview
      films={films}
      audience={{ man: "/man.glb", woman: "/woman.glb" }}
      seatModel="/cinema-seat.glb"
    />
  );
}
```

`films` is your list of posters, trailers, and showtimes. The package does not include those files. Each showtime carries a standard price and a recliner price. `audience` points at two GLB files of people sitting down. Full prop notes are in [`packages/react-3d-cinema-preview/README.md`](packages/react-3d-cinema-preview/README.md).

Serve the page with any static server. A `file://` URL cannot load the modules or the models.

## Run this repo

```bash
npm install
npm run dev
```

Developed by [Michael Lau](http://nullmicgo.com/).

## Demo

A walk through the lobby, a showtime, a seat, and the view from that seat. The recording has sound. Unmute the player if you want the trailer.

https://github.com/user-attachments/assets/3449dfe5-6c99-41cd-bec3-d0f84f0e0cb1

## Screen flow

The page is four full-screen layers in one document. Only one task layer is interactive at a time. The WebGL canvas stays hidden until the visitor asks to see the seat.

```text
Lobby  →  Showtimes  →  Seat chart  →  Seat view
#lobby     #times         #map          #stage + #pov-chrome
```

1. **Lobby.** Date chips and two poster cards. The chips only move the underline. Both films stay listed on every date. The footer states that this is a mock.
2. **Showtimes.** Tapping a poster fills the title, rating line, and that film's slots. Each slot shows a time, the standard price, and `HOUSE 3`. Back returns to the lobby.
3. **Seat chart.** Tapping a slot writes that slot's standard and recliner prices, swaps the trailer if the film changed, and shows Hall 3. Row A is nearest the screen. Rows H and I are recliners. Taken seats cannot be selected. The footer shows the chosen seat and its price.
4. **Seat view.** **See this seat** unmutes the trailer and flies the camera from above the chair down to sitting height. A card at the bottom names the seat and the price on the first line, and puts the seat type, **Change**, and **Hold** on the second. **Hold** only changes the button to "Held for you" in this browser. **Change**, or the back chevron, flies back to the chart and pauses the video. **Showtimes** returns to the slot list.

Dragging on the seat view looks a little left, right, up, and down. The look returns to the seat's aim when you leave.

## Sequence

Four participants carry the visit. The page is the DOM. The hall is the Three.js scene, already running behind a hidden canvas. The video element is the trailer. Nothing here calls a server.

### From the lobby to a held seat

```mermaid
sequenceDiagram
  actor Visitor
  participant Page as Page
  participant Hall as Three.js hall
  participant Video as Trailer

  Visitor->>Page: Open the site
  Page->>Hall: Build the hall and start the loop
  Note over Hall: Canvas stays hidden on the lobby
  Visitor->>Page: Tap a poster
  Page->>Page: Fill that film's title and slots
  Visitor->>Page: Tap a showtime
  Page->>Video: Set that film's mp4 and play, muted
  Page->>Page: Show the seat chart with that slot's prices
  Visitor->>Page: Tap a free seat
  Page->>Hall: Paint the previous chair back, paint this one mint
  Visitor->>Page: See this seat
  Page->>Video: Unmute
  Page->>Hall: Show the canvas and fly down to the seat
  Hall-->>Visitor: Sitting view
  Visitor->>Page: Hold
  Note over Page: The button reads Held for you. Nothing is booked.
  Visitor->>Page: Change
  Page->>Hall: Fly back overhead, then hide the canvas
  Page->>Video: Pause
```

### Choosing a showtime

```mermaid
sequenceDiagram
  actor Visitor
  participant Slot as Showtime button
  participant Film as Active film
  participant Video as Trailer
  participant Chart as Seat chart

  Visitor->>Slot: Tap a time
  Slot->>Film: Copy standard and recliner prices
  Slot->>Chart: Write the showtime into the header
  Slot->>Chart: Reprice the seat already selected
  alt Trailer file changed
    Slot->>Video: Pause, replace src, load
  else Same film as the last slot
    Slot->>Video: Keep the current src
  end
  Slot->>Chart: Show the chart and hide the slot list
  Slot->>Video: play, still muted
```

Date chips are not in this sequence. Tapping one only moves the underline. Both films stay on the lobby for every date.

### Seeing the seat, then leaving it

```mermaid
sequenceDiagram
  actor Visitor
  participant Page as Page
  participant Camera as Camera
  participant Mode as mode

  Visitor->>Page: See this seat
  Page->>Mode: map to flying
  Page->>Camera: Place overhead, then bezier to the eye
  Note over Camera: 1.15 seconds, or a jump if motion is reduced
  Camera->>Mode: flying to seat
  Page-->>Visitor: Slide up the seat card
  Visitor->>Camera: Drag
  Note over Camera: Yaw and pitch offset the look target
  Visitor->>Page: Change, or the back chevron
  Page->>Mode: seat to flying
  Page->>Camera: Bezier from the eye back overhead
  Camera->>Mode: flying to map
  Page->>Page: Hide the canvas, pause the trailer, reset Hold
```

Hold does not leave the seat. It only disables the button and changes its label.

### What the page builds before the first tap

```mermaid
sequenceDiagram
  participant Page as Page
  participant Three as three
  participant Scene as Scene
  participant Models as GLB files

  Page->>Three: Import THREE, GLTFLoader, RectAreaLightUniformsLib
  Page->>Scene: Renderer, black fog, camera
  Page->>Scene: Ambient light, then init the rect-area uniforms
  Page->>Scene: Screen-sized RectAreaLight aimed down the aisle
  Page->>Scene: Floor, ceiling, mask, back wall, screen, 108 empty chair groups
  Page->>Models: Load cinema-seat.glb and clone it into every group
  Page->>Models: Load man.glb and woman.glb
  Models-->>Scene: One person on each taken seat
  Page->>Page: Start tick. Canvas class stays is-off
```

## Technical solution

The site is a React app. `CinemaPreview` in the `react-3d-cinema-preview` package owns the lobby, showtimes, seat chart, and the Three.js hall. The hall stays hidden until the visitor asks to see the seat. There is no backend. The hall module imports `THREE`, `GLTFLoader`, and `RectAreaLightUniformsLib` from the `three` package. `RectAreaLightUniformsLib.init()` has to run before the screen light is created, or that light does not shade anything.

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

Nine rows, A through I, twelve seats each. The same list builds both the buttons and the 3D chairs, and neighbouring seats use one gap in both.

A seat is taken when it is not a recliner and `(rowIndex * 5 + seatNumber * 3) % 7 === 0`. That is a fixed pattern, not a booking system. On the chart, row A is 76% of the chart width and each row behind it is 3% wider, so row I fills the width. The seats flex to fit the phone, which is why the price and **See this seat** stay on screen.

Selecting a seat paints that chair mint in the 3D scene and writes the row, number, and price into the footer. The default seat is B4.

### Three.js scene

One `WebGLRenderer` draws into the `#stage` canvas. The canvas is in the page from the start, but the class `is-off` sets `visibility: hidden` until **See this seat**. The scene is already built and the animation loop is already running. Hiding the canvas is what stops the hall from flashing through the lobby.

Renderer settings:

- Output color space `SRGBColorSpace`, so the video and the seat colors match the screen.
- `ACESFilmicToneMapping` at exposure `1.08`, so the screen light rolls off instead of clipping the seat tops white.
- Pixel ratio capped at 2.
- Fog from 30 to 52 units, black, so the back of the room falls away.

The scene graph is small. A black floor, ceiling, a mask plane behind the screen, and a back wall. In front of those sit the screen bezel, the screen plane, and 108 chair groups. Units are metres. The screen is at `z = 0`. Positive `z` walks back through the audience. Positive `y` is up.

Each seat is placed from its row index `r` (A is 0) and number `n`:

```text
x = (n - 6.5) * 0.62
z = 7.4 + r * 1.46
y = 0.15 + r * 0.22
```

Every pair of neighbours is 0.62 m apart, including seats 6 and 7, so the hall matches the even gaps on the chart.

Row A is the closest row. Each row behind it is 1.46 m farther from the screen and 0.22 m higher, which is the floor rake. The 2D chart uses the same list. It does not use these metre values. It draws row A at 76% of the chart width and adds 3% of width per row back.

### A chair

Every chair is a copy of `cinema-seat.glb`, the upholstered seat with a headrest, cup holder, and fabric maps. The model is turned to face the screen, then set on the floor at that seat's rake. One material set is shared: the cloth texture as it is for a free seat, a rose tint for a recliner, a darker tint for a taken seat, and a mint tint for the selected seat. Selecting a seat swaps that chair onto the mint material. The chair's local `+z` stays the back, away from the screen, so a person sitting in it faces `-z`.

### Screen, video, and light

The cinema screen is a 22 by 10 plane, about 2.2:1, centred at `y = 6.15`. Its material is `MeshBasicMaterial`, so the picture is not affected by lights. The picture is a `VideoTexture` on a `<video>` element that is in the DOM at 1 by 1 pixel and fully transparent. The element has to exist and be allowed to play. Three.js copies the current video frame into the texture while the renderer draws.

Trailers are 16:9. The screen is wider, so the texture is cropped instead of letterboxed:

```text
repeat.y  = (16 / 9) / (22 / 10)   ≈ 0.808
offset.y  = (1 - repeat.y) / 2
```

That keeps the middle of the frame and cuts the top and bottom. Playback starts when a showtime is tapped, which is a user gesture, so the browser allows it. The video stays muted until **See this seat**. It loops, and it pauses when the visitor leaves the seat view. Switching films replaces `video.src` only when the URL changed, then calls `load()` and `play()`.

The seats are not lit from behind the audience. A `RectAreaLight` the same size as the screen sits just in front of it, at `(0, 6.15, 0.55)`, and `lookAt(0, 1.6, 18)` aims it down the aisle. A rect area light emits along its local `-z`, and `lookAt` points that axis at the target, so the light travels from the screen toward the seats. An `AmbientLight` at intensity `0.2` keeps the unlit side from going pure black. Seat tops and faces toward the screen catch the picture light. The backs of the chairs stay dark.

### Camera and the fly-in

The camera is a `PerspectiveCamera` with near `0.08` and far `100`. A `ResizeObserver` sets the aspect from the canvas. When the canvas is taller than it is wide, the vertical field of view opens from 52 degrees to 64 degrees. A phone is tall, and 52 degrees aimed at the screen cuts off the seat backs in the next row. The wider phone field of view keeps that row above the bottom bar.

For a chosen seat the eye and the look target are:

```text
eye    = (seat.x,  seat.y + 1.05, seat.z - 0.02)
target = (seat.x * 0.42, eye.y + 0.55, 0)
```

The eye is sitting height, just in front of that chair's back. Multiplying `x` by `0.42` turns a side seat toward the middle of the screen instead of staring at the side wall. Adding `0.55` to the eye height looks slightly upward, which leaves the row in front in the lower part of the frame.

The flight is one quadratic bezier for position and a second one for the look point. It starts overhead at about 7.6 m above the seat, passes a control point 4.6 m up, and ends at the eye. Each frame does:

```text
t = min(1, t + dt / 1.15)
e = 1 - (1 - t)³
position = quad(overhead, control, eye, e)
look     = quad(overheadLook, controlLook, target, e)
camera.lookAt(look)
```

The cubic ease-out spends more time settling into the chair than leaving the overhead view. `prefers-reduced-motion` copies the end pose and skips the curve. The mode goes `map` → `flying` → `seat`. The bottom bar is closed during the flight and opens when `t` reaches 1. Leaving the seat runs the same curve backwards, hides the canvas again, and pauses the video.

While `mode` is `seat`, a drag does not move the camera. It offsets the look target: yaw adds to `x`, pitch subtracts from `y`, both clamped. Releasing the pointer keeps the last offset until the visitor leaves the seat, which resets both to 0.

### People in taken seats

`GLTFLoader` loads `man.glb` and `woman.glb` once. They are baked sitting poses from Mixamo, not skinned at runtime. The exported vertices are in centimetres and the body stands along local `-z` (the head is near `z = -133`, the feet near `z = 0`). Putting that mesh in the hall takes two rotations, and they cannot be the same object's Euler angles. Three.js applies an XYZ Euler in an order that lays the mesh through the floor if both turns are on one object.

The fix is a child and a parent:

```text
child.rotation.x = π / 2      stand the -z body up onto +y
child.scale      = 0.0084     centimetres to metres, small enough to sit in the headrest
parent.rotation.y = π + yaw   turn the face from the camera toward the screen
parent.position  = (0, 0.02, 0.02)
```

The parent is added to the chair group, so the person moves with that seat. `(rowIndex + seatNumber) % 2 === 0` uses the woman. The other taken seats use the man. A small yaw, a few degrees, keeps the row from looking cloned. Hair and glasses come in with blended transparency. Those materials are switched to `alphaTest = 0.45`, `transparent = false`, and `depthWrite = true`, and every mesh is `frustumCulled = false`. Without that, the hair sorts in front of the screen or disappears when the scaled bounds fall outside the frustum.

## Run it locally

```bash
npm install
npm run dev
```

Vite prints a local URL. Opening the built files directly fails. ES modules and the model loader need an HTTP origin.

## What is in this repo

| Path | Role |
| --- | --- |
| `packages/react-3d-cinema-preview` | The React library, published as `react-3d-cinema-preview` |
| `apps/web` | This site, which renders `CinemaPreview` |
| `apps/web/public` | Posters, trailers, `cinema-seat.glb`, and the two seated models |
| `demo.mp4` | The walkthrough encoded for this README |

Posters and trailers are used here as a personal mock. They belong to their rights holders.

## Publish to npm

The package name on npm is `react-3d-cinema-preview`. From this repository, on a machine logged in to npm:

```bash
npm login
npm publish -w react-3d-cinema-preview --access public
```

`npm login` opens a browser to npmjs and stores the token on this machine. The workspace script builds the library first (`tsc`, `tsup`, and the stylesheet), then uploads `dist`, `README.md`, and `LICENSE`. React, React DOM, and Three.js stay as peer dependencies, so people install those alongside the package.

After it succeeds, `npm install react-3d-cinema-preview` works from the Install section above. A later change needs a new version in `packages/react-3d-cinema-preview/package.json` before the next `npm publish`.

## Credits

- [Website](http://nullmicgo.com/)
- [LinkedIn](https://www.linkedin.com/in/nullmicgo/)
- [YouTube](https://www.youtube.com/@nullmicgo)
