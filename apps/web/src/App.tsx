import { CinemaPreview } from "react-3d-cinema-preview";
import "react-3d-cinema-preview/style.css";
import { audience, credit, films } from "./films";

export function App() {
  return <CinemaPreview films={films} audience={audience} credit={credit} seatModel="/cinema-seat.glb" />;
}
