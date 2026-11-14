import { useEffect, useMemo, useRef, useState } from "react";
import { Hall } from "./hall";
import { buildSeats, hkd, ROWS, seatSpot } from "./seats";
import type { CinemaFilm, CinemaPreviewProps, CinemaShowtime, Seat } from "./types";

const DEFAULT_DATES = ["現正預售", "今日", "11月15日(日)", "11月16日(一)"];

export function CinemaPreview({
  films,
  audience,
  seatModel,
  venue = "Hong Kong Cinema",
  venueZh = "香港戲院",
  hall = "Hall 3",
  dates = DEFAULT_DATES,
  showingDate = "2026年11月14日",
  credit,
  height = "viewport",
}: CinemaPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hallRef = useRef<Hall | null>(null);
  const seats = useMemo(() => buildSeats(), []);
  const [screen, setScreen] = useState<"lobby" | "times" | "chart" | "seat">("lobby");
  const [dateIndex, setDateIndex] = useState(0);
  const [film, setFilm] = useState<CinemaFilm | null>(films[0] ?? null);
  const [prices, setPrices] = useState({ standard: 0, recliner: 0 });
  const [showLabel, setShowLabel] = useState(hall);
  const [selectedId, setSelectedId] = useState("B4");
  const [stageOn, setStageOn] = useState(false);
  const [chromeOn, setChromeOn] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [held, setHeld] = useState(false);

  const trailer = films[0]?.trailer ?? "";
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trailer) return;
    const engine = new Hall(canvas, { trailer, man: audience.man, woman: audience.woman, seat: seatModel });
    hallRef.current = engine;
    return () => {
      engine.dispose();
      hallRef.current = null;
    };
  }, [audience.man, audience.woman, seatModel, trailer]);

  const selected = seats.find((seat) => seat.id === selectedId) ?? seats[0];
  const price = selected ? (selected.recliner ? prices.recliner : prices.standard) : 0;

  function openFilm(next: CinemaFilm) {
    setFilm(next);
    setScreen("times");
  }

  function openShow(slot: CinemaShowtime) {
    const engine = hallRef.current;
    if (!film || !engine) return;
    setPrices({ standard: slot.standard, recliner: slot.recliner });
    setShowLabel(`${slot.label} · ${hall}`);
    engine.setTrailer(film.trailer);
    setScreen("chart");
    engine.play();
  }

  function choose(seat: Seat) {
    const next = hallRef.current?.choose(seat.id);
    if (next) setSelectedId(next.id);
  }

  function seeSeat() {
    const engine = hallRef.current;
    if (!engine) return;
    engine.setSound(true);
    setSoundOn(true);
    setHeld(false);
    setSheetOpen(false);
    setChromeOn(true);
    setStageOn(true);
    setScreen("seat");
    engine.enter(() => setSheetOpen(true));
  }

  function leaveSeat() {
    const engine = hallRef.current;
    if (!engine) return;
    setSheetOpen(false);
    engine.leave(() => {
      setChromeOn(false);
      setStageOn(false);
      setScreen("chart");
      setHeld(false);
      engine.pause();
    });
  }

  function backToTimes() {
    const engine = hallRef.current;
    if (!engine || engine.mode !== "map") return;
    engine.pause();
    setScreen("times");
  }

  function toggleSound() {
    const engine = hallRef.current;
    if (!engine) return;
    const next = !engine.soundOn;
    engine.setSound(next);
    setSoundOn(next);
  }

  return (
    <div className={height === "parent" ? "hkc hkc-fill" : "hkc"}>
      <canvas ref={canvasRef} className={stageOn ? "hkc-stage" : "hkc-stage is-off"} aria-label="View from the selected seat" />

      {screen === "chart" && selected && (
        <section className="hkc-map" aria-label="Seat chart">
          <header>
            <button type="button" onClick={backToTimes}>‹ Showtimes</button>
            <h1>{showLabel}</h1>
            <p>{venue}</p>
          </header>
          <div className="hkc-screen">
            <svg viewBox="0 0 320 36" aria-hidden="true">
              <path d="M8 30 Q160 -8 312 30" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p>SCREEN</p>
          </div>
          <div className="hkc-grid" role="grid" aria-label="Seats">
            {ROWS.map((row, r) => (
              <div className="hkc-row" key={row} style={{ width: `${76 + r * 3}%` }}>
                <span>{row}</span>
                {seats.filter((seat) => seat.row === row).map((seat) => (
                  <button
                    key={seat.id}
                    type="button"
                    className={"hkc-seat" + (seat.taken ? " taken" : "") + (seat.recliner ? " recliner" : "") + (seat.id === selectedId ? " selected" : "")}
                    disabled={seat.taken}
                    aria-label={`Row ${seat.row} seat ${seat.n}${seat.taken ? ", taken" : ""}`}
                    onClick={() => choose(seat)}
                  >
                    {seat.id === selectedId ? seat.n : ""}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <footer>
            <div className="hkc-key">
              <span><i style={{ background: "#3a3a42" }} />Available</span>
              <span><i style={{ background: "#6d6d76" }} />Taken</span>
              <span><i style={{ background: "#8d5d66" }} />Recliner</span>
              <span><i style={{ background: "#5eead4" }} />Selected</span>
            </div>
            <div className="hkc-pick">
              <p>Row {selected.row} · Seat {selected.n}</p>
              <strong>{hkd(price)}</strong>
            </div>
            <button type="button" className="hkc-go" onClick={seeSeat}>See this seat</button>
          </footer>
        </section>
      )}

      {chromeOn && selected && (
        <div className="hkc-chrome">
          <div className="hkc-top">
            <button type="button" className="hkc-round" aria-label="Change seat" onClick={leaveSeat}>‹</button>
            <p className="hkc-pill"><i />View from {selected.row}{selected.n}</p>
            <button type="button" className="hkc-sound" onClick={toggleSound}>{soundOn ? "Mute" : "Sound"}</button>
          </div>
          <section className={sheetOpen ? "hkc-sheet is-open" : "hkc-sheet"}>
            <div className="hkc-sheet-top">
              <h2>Row {selected.row}, Seat {selected.n}</h2>
              <strong>{hkd(price)}</strong>
            </div>
            <div className="hkc-sheet-bottom">
              <p>{selected.recliner ? "Recliner" : "Standard"} · {seatSpot(selected)}</p>
              <div className="hkc-sheet-actions">
                <button type="button" className="hkc-change" onClick={leaveSeat}>Change</button>
                <button type="button" className="hkc-hold" disabled={held} onClick={() => setHeld(true)}>{held ? "Held for you" : "Hold"}</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {screen === "lobby" && (
        <section className="hkc-lobby" aria-label="Films">
          <header className="hkc-brand">
            <h1>{venue.toUpperCase()}</h1>
            <p>{venueZh}</p>
          </header>
          <div className="hkc-column">
            <div className="hkc-dates" role="tablist" aria-label="Dates">
              {dates.map((date, index) => (
                <button key={date} type="button" aria-selected={index === dateIndex} onClick={() => setDateIndex(index)}>{date}</button>
              ))}
            </div>
            <div className="hkc-scroll">
              <div className="hkc-films">
                {films.map((item) => (
                  <button key={item.id} type="button" className="hkc-film" onClick={() => openFilm(item)}>
                    <img src={item.poster} alt="" width={384} height={520} />
                    <strong>《{item.zh}》</strong>
                    <span className="hkc-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
                  </button>
                ))}
              </div>
              <footer className="hkc-note">
                {credit?.line && <p>{credit.line}</p>}
                {credit?.author && <p>Developed by {credit.author}.</p>}
                {credit?.links && credit.links.length > 0 && (
                  <p className="hkc-links">
                    {credit.links.map((link) => (
                      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                    ))}
                  </p>
                )}
              </footer>
            </div>
          </div>
        </section>
      )}

      {screen === "times" && film && (
        <section className="hkc-times" aria-label="Showtimes">
          <div className="hkc-column">
            <header className="hkc-brand">
              <button type="button" className="hkc-back" aria-label="Back to films" onClick={() => setScreen("lobby")}>‹</button>
              <h1>{venue.toUpperCase()}</h1>
              <p>{venueZh}</p>
            </header>
            <div className="hkc-filmhead">
              <h2>《{film.zh}》 {film.title}</h2>
              <span className="hkc-format">{film.formats}</span>
              <p className="hkc-meta">{film.meta}</p>
            </div>
            <div className="hkc-scroll">
              <p className="hkc-day">{showingDate}</p>
              <p className="hkc-place">{venue}</p>
              <p className="hkc-hall">{hall}</p>
              {film.slots.map((slot) => (
                <button key={slot.label} type="button" className="hkc-slot" onClick={() => openShow(slot)}>
                  <span className="hkc-slot-row"><span>{slot.time}</span><span>{hkd(slot.standard)}</span></span>
                  <small>{slot.house}</small>
                  <span className="hkc-chip">{film.zh}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
