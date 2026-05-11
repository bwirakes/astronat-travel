export type ReadingKind = "travel" | "relocation" | "couples" | "weather";

export type BirthProfile = {
  firstName: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthLat: number | null;
  birthLon: number | null;
};

export type ReadingSummary = {
  id: string;
  destination: string;
  score: number | null;
  kind: ReadingKind;
  createdAt: string;
};

export type GenerateReadingRequest = {
  destination: string;
  targetLat: number;
  targetLon: number;
  travelDate: string;
  goals: string[];
  kind: Exclude<ReadingKind, "weather">;
  partnerId?: string;
};

export type GenerateReadingResponse =
  | { ok: true; readingId: string }
  | { ok: false; code: string; message: string };
