export type CinemaShowtime = {
  label: string;
  time: string;
  house: string;
  standard: number;
  recliner: number;
};

export type CinemaFilm = {
  id: string;
  title: string;
  zh: string;
  meta: string;
  formats: string;
  poster: string;
  trailer: string;
  tags: string[];
  slots: CinemaShowtime[];
};

export type CinemaLink = {
  label: string;
  href: string;
};

export type CinemaCredit = {
  line?: string;
  author?: string;
  links?: CinemaLink[];
};

export type CinemaPreviewProps = {
  films: CinemaFilm[];
  audience: { man: string; woman: string };
  /** URL of a GLB cinema seat. One copy is placed on every chair. */
  seatModel: string;
  venue?: string;
  venueZh?: string;
  hall?: string;
  dates?: string[];
  showingDate?: string;
  credit?: CinemaCredit;
  /** `viewport` fills the screen. `parent` fills a sized parent. */
  height?: "viewport" | "parent";
};

export type Seat = {
  id: string;
  row: string;
  n: number;
  r: number;
  recliner: boolean;
  taken: boolean;
  x: number;
  y: number;
  z: number;
};
