import { CinemaPreview } from "react-seatview";
import "react-seatview/style.css";
import { audience, credit, films } from "./films";

export function App() {
  return <CinemaPreview films={films} audience={audience} credit={credit} seatModel="/cinema-seat.glb" />;
}
