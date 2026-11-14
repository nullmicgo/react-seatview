# Hong Kong Cinema

A mock cinema app for picking a seat in Hall 3 and seeing the screen from that seat. It is not a real cinema, and it does not take payment.

Live preview: [mocl-hong-kong-cinema.nullmicgo.com](https://mocl-hong-kong-cinema.nullmicgo.com)

Developed by [Michael Lau](http://nullmicgo.com/).

## What you can do

1. Choose a film. The lobby lists 《鎗火》 (*The Mission*, 1999) and 《柔道龍虎榜》 (*Throw Down*, 2004).
2. Pick a showtime. Prices are sample Saturday-night Hong Kong prices in HKD. Recliner rows H and I cost more than a standard seat.
3. Choose a seat on the Hall 3 chart. Grey seats are taken. Rose seats are recliners.
4. Open the view from that seat. The camera flies into the chair, the trailer plays on the cinema screen, and people are already sitting in the taken seats.

**Hold** only marks the seat on this device. Nothing is booked.

## Run it locally

The page loads Three.js as a module and reads the posters, trailers, and seated models from this folder, so it needs a local server. Opening `index.html` as a file will not work.

```bash
python3 -m http.server 8771
```

Then open [http://127.0.0.1:8771/](http://127.0.0.1:8771/).

There is no install step and no build. The page is one `index.html` file, with Tailwind and Three.js loaded from a CDN.

## What is in this repo

| File | Role |
| --- | --- |
| `index.html` | The whole app: lobby, showtimes, seat chart, and the 3D hall |
| `poster001.jpeg` | Poster for 《鎗火》 |
| `Throw-Down-poster.jpg` | Poster for 《柔道龍虎榜》 |
| `man.glb`, `woman.glb` | Seated audience on taken seats |
| The two `.mp4` files | Trailers played on the cinema screen |

Posters and trailers are used here as a personal mock. They belong to their rights holders.

## Credits

- [Website](http://nullmicgo.com/)
- [LinkedIn](https://www.linkedin.com/in/nullmicgo/)
- [YouTube](https://www.youtube.com/@nullmicgo)
