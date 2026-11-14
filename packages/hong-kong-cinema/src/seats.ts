import type { Seat } from "./types";

export const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
export const SEATS_PER_ROW = 12;

export function buildSeats(): Seat[] {
  const seats: Seat[] = [];
  ROWS.forEach((row, r) => {
    for (let n = 1; n <= SEATS_PER_ROW; n++) {
      const recliner = r >= 7;
      const taken = !recliner && (r * 5 + n * 3) % 7 === 0;
      const pitch = 0.84;
      const aisle = 1.85;
      const x = n <= 6 ? -aisle / 2 - (6 - n) * pitch : aisle / 2 + (n - 7) * pitch;
      seats.push({
        id: row + n,
        row,
        n,
        r,
        recliner,
        taken,
        x,
        y: 0.15 + r * 0.22,
        z: 7.4 + r * 1.46,
      });
    }
  });
  return seats;
}

export function seatSpot(seat: Seat): string {
  if (seat.r <= 2) return "Up close";
  if (seat.r <= 5) return "Sweet spot";
  return "Full picture";
}

export function hkd(n: number): string {
  return "HK$" + Math.round(n);
}
